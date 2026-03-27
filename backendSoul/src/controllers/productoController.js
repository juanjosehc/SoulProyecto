const pool = require('../config/db');
const cloudinary = require('../config/cloudinary');

// 1. Obtener todos los productos (Con sus imágenes y tallas agrupadas)
const obtenerProductos = async (req, res) => {
  try {
    const sql = `
      SELECT 
        p.id, 
        p.nombre as name, 
        p.precio as price, 
        p.is_active as "isActive",
        p.genero as gender,
        c.nombre as category,
        c.id as "categoryId",
        c.is_active as "categoryActive",
        COALESCE((SELECT SUM(stock) FROM producto_tallas WHERE producto_id = p.id), 0) as stock,
        COALESCE(
          (SELECT json_agg(json_build_object('id', pi2.id, 'url', pi2.url_imagen, 'esPrincipal', pi2.es_principal) ORDER BY pi2.es_principal DESC) 
           FROM producto_imagenes pi2 WHERE pi2.producto_id = p.id), '[]'::json
        ) as images,
        COALESCE((SELECT json_object_agg(talla, stock) FROM producto_tallas WHERE producto_id = p.id), '{}'::json) as "stockBySize"
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      ORDER BY p.id DESC;
    `;
    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 1b. Obtener solo productos activos (para catálogo)
const obtenerProductosActivos = async (req, res) => {
  try {
    const sql = `
      SELECT 
        p.id, 
        p.nombre as name, 
        p.precio as price, 
        p.genero as gender,
        c.nombre as category,
        COALESCE(
          (SELECT url_imagen FROM producto_imagenes WHERE producto_id = p.id AND es_principal = true LIMIT 1),
          (SELECT url_imagen FROM producto_imagenes WHERE producto_id = p.id LIMIT 1)
        ) as image,
        COALESCE(
          (SELECT json_agg(url_imagen) FROM producto_imagenes WHERE producto_id = p.id), '[]'::json
        ) as images,
        COALESCE(
          (SELECT json_agg(DISTINCT talla) FROM producto_tallas WHERE producto_id = p.id AND stock > 0), '[]'::json
        ) as sizes,
        COALESCE((SELECT SUM(stock) FROM producto_tallas WHERE producto_id = p.id), 0) as stock
      FROM productos p
      JOIN categorias c ON p.categoria_id = c.id
      WHERE p.is_active = true AND c.is_active = true
      ORDER BY p.id DESC;
    `;
    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 1c. Buscar productos (autocomplete) - CON TALLAS Y STOCK
const buscarProductos = async (req, res) => {
  try {
    const { q } = req.query;
    const result = await pool.query(
      `SELECT p.id, p.nombre as name, p.precio as price,
        COALESCE(
          (SELECT json_agg(json_build_object('talla', pt.talla, 'stock', pt.stock) ORDER BY pt.talla)
           FROM producto_tallas pt WHERE pt.producto_id = p.id AND pt.stock > 0), '[]'::json
        ) as sizes
       FROM productos p WHERE p.is_active = true AND p.nombre ILIKE $1 ORDER BY p.nombre LIMIT 20`,
      [`%${q || ''}%`]
    );
    // Mapear sizes a array simple para compatibilidad
    const rows = result.rows.map(r => ({
      ...r,
      sizesDetail: r.sizes, // Array de {talla, stock}
      sizes: r.sizes.map(s => s.talla) // Array simple de tallas para selects
    }));
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Crear Producto (Transacción Múltiple)
const crearProducto = async (req, res) => {
  const cliente = await pool.connect();

  try {
    const { name, category, price, images, stockBySize, gender } = req.body;
    
    await cliente.query('BEGIN');

    // A. Buscar el ID de la categoría por su nombre
    const catResult = await cliente.query('SELECT id FROM categorias WHERE nombre = $1', [category]);
    if (catResult.rows.length === 0) throw new Error('La categoría no existe');
    const categoriaId = catResult.rows[0].id;

    // B. Insertar el Producto base
    const prodResult = await cliente.query(
      'INSERT INTO productos (categoria_id, nombre, precio, genero) VALUES ($1, $2, $3, $4) RETURNING id',
      [categoriaId, name, price, gender || 'Unisex']
    );
    const nuevoProductoId = prodResult.rows[0].id;

    // C. Insertar las Imágenes
    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const url = typeof images[i] === 'string' ? images[i] : images[i].url;
        const esPrincipal = typeof images[i] === 'object' ? images[i].esPrincipal === true : (i === 0);
        await cliente.query(
          'INSERT INTO producto_imagenes (producto_id, url_imagen, es_principal) VALUES ($1, $2, $3)',
          [nuevoProductoId, url, esPrincipal]
        );
      }
    }

    // D. Insertar el Stock por Tallas
    for (const [talla, cantidad] of Object.entries(stockBySize)) {
      if (cantidad !== '' && cantidad !== null) {
        await cliente.query(
          'INSERT INTO producto_tallas (producto_id, talla, stock) VALUES ($1, $2, $3)',
          [nuevoProductoId, talla, Number(cantidad)]
        );
      }
    }

    await cliente.query('COMMIT');
    res.status(201).json({ message: 'Producto creado con éxito' });

  } catch (error) {
    await cliente.query('ROLLBACK');
    console.error("Error en crearProducto:", error);
    res.status(500).json({ error: error.message });
  } finally {
    cliente.release();
  }
};

// 3. Editar Producto
const editarProducto = async (req, res) => {
  const cliente = await pool.connect();
  try {
    const { id } = req.params;
    const { name, category, price, images, stockBySize, gender } = req.body;
    
    await cliente.query('BEGIN');

    // Buscar categoría
    const catResult = await cliente.query('SELECT id FROM categorias WHERE nombre = $1', [category]);
    const categoriaId = catResult.rows[0].id;

    // Actualizar Producto Base
    await cliente.query(
      'UPDATE productos SET categoria_id = $1, nombre = $2, precio = $3, genero = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5',
      [categoriaId, name, price, gender || 'Unisex', id]
    );

    // Actualizar Imágenes (Borramos las viejas y ponemos las nuevas)
    await cliente.query('DELETE FROM producto_imagenes WHERE producto_id = $1', [id]);
    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const url = typeof images[i] === 'string' ? images[i] : images[i].url;
        const esPrincipal = typeof images[i] === 'object' ? images[i].esPrincipal : (i === 0);
        await cliente.query(
          'INSERT INTO producto_imagenes (producto_id, url_imagen, es_principal) VALUES ($1, $2, $3)',
          [id, url, esPrincipal]
        );
      }
    }

    // Actualizar Tallas (Borramos las viejas y reinsertamos las nuevas)
    await cliente.query('DELETE FROM producto_tallas WHERE producto_id = $1', [id]);
    for (const [talla, cantidad] of Object.entries(stockBySize)) {
      if (cantidad !== '' && cantidad !== null) {
        await cliente.query('INSERT INTO producto_tallas (producto_id, talla, stock) VALUES ($1, $2, $3)', [id, talla, Number(cantidad)]);
      }
    }

    await cliente.query('COMMIT');
    res.json({ message: 'Producto actualizado' });

  } catch (error) {
    await cliente.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    cliente.release();
  }
};

// 4. Cambiar Estado (con validación de categoría activa)
const cambiarEstadoProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    // Si se intenta ACTIVAR, verificar que la categoría esté activa
    if (is_active) {
      const result = await pool.query(`
        SELECT c.is_active as cat_active, c.nombre as cat_nombre
        FROM productos p 
        JOIN categorias c ON p.categoria_id = c.id 
        WHERE p.id = $1
      `, [id]);

      if (result.rows.length > 0 && !result.rows[0].cat_active) {
        return res.status(400).json({ 
          error: `No se puede activar el producto porque su categoría "${result.rows[0].cat_nombre}" está inactiva. Activa la categoría primero.` 
        });
      }
    }

    await pool.query('UPDATE productos SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [is_active, id]);
    res.json({ message: 'Estado actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5. Eliminar (Físico)
const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM productos WHERE id = $1', [id]);
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    if (error.code === '23503') return res.status(400).json({ error: 'No se puede eliminar porque tiene ventas asociadas.' });
    res.status(500).json({ error: error.message });
  }
};

// 6. Subir imagen a Cloudinary
const subirImagen = async (req, res) => {
  try {
    const { image } = req.body; // Base64 image

    if (!image) {
      return res.status(400).json({ error: 'No se proporcionó imagen' });
    }

    const result = await cloudinary.uploader.upload(image, {
      folder: 'soul_products',
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto' }
      ]
    });

    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (error) {
    console.error('Error al subir imagen:', error);
    res.status(500).json({ error: 'Error al subir la imagen a Cloudinary' });
  }
};

module.exports = {
  obtenerProductos, obtenerProductosActivos, buscarProductos,
  crearProducto, editarProducto, cambiarEstadoProducto, eliminarProducto, subirImagen
};