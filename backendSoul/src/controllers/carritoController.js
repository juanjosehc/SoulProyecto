const pool = require('../config/db');

// Obtener carrito del cliente
const obtenerCarrito = async (req, res) => {
  try {
    const clienteId = req.user.id;
    if (req.user.tipo !== 'cliente') {
      return res.status(403).json({ error: 'Solo los clientes pueden tener un carrito.' });
    }

    const result = await pool.query(`
      SELECT 
        c.producto_id as id,
        p.nombre as name,
        p.precio as price,
        c.talla as size,
        c.cantidad as quantity,
        COALESCE(
          (SELECT url_imagen FROM producto_imagenes WHERE producto_id = p.id AND es_principal = true LIMIT 1),
          (SELECT url_imagen FROM producto_imagenes WHERE producto_id = p.id LIMIT 1),
          'https://via.placeholder.com/400x300?text=Sin+Imagen'
        ) as image,
        COALESCE(
          (SELECT stock FROM producto_tallas WHERE producto_id = p.id AND talla = c.talla LIMIT 1),
          0
        ) as "maxStock"
      FROM carrito c
      JOIN productos p ON c.producto_id = p.id
      WHERE c.cliente_id = $1
      ORDER BY c.id ASC
    `, [clienteId]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Guardar/Actualizar el carrito completo
const guardarCarrito = async (req, res) => {
  const connection = await pool.connect();
  try {
    const clienteId = req.user.id;
    if (req.user.tipo !== 'cliente') {
      return res.status(403).json({ error: 'Solo los clientes pueden tener un carrito.' });
    }
    const { items } = req.body; // Array de { id, size, quantity }

    await connection.query('BEGIN');

    // Limpiar carrito actual del cliente
    await connection.query('DELETE FROM carrito WHERE cliente_id = $1', [clienteId]);

    // Insertar los nuevos items
    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        // Validar que el producto y la talla existan antes de guardar en el carrito
        const prod = await connection.query('SELECT id FROM productos WHERE id = $1', [item.id]);
        if (prod.rows.length > 0) {
          await connection.query(`
            INSERT INTO carrito (cliente_id, producto_id, talla, cantidad)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (cliente_id, producto_id, talla)
            DO UPDATE SET cantidad = EXCLUDED.cantidad, updated_at = CURRENT_TIMESTAMP
          `, [clienteId, item.id, item.size, item.quantity]);
        }
      }
    }

    await connection.query('COMMIT');
    res.json({ message: 'Carrito guardado exitosamente' });
  } catch (error) {
    await connection.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

module.exports = { obtenerCarrito, guardarCarrito };
