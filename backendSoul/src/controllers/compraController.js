const pool = require('../config/db');

// 1. Obtener todas las compras
// 1. Obtener todas las compras
const obtenerCompras = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.id, 
        p.nombre as supplier, 
        TO_CHAR(c.fecha_compra, 'YYYY-MM-DD') as date, 
        c.total, 
        c.estado as status, 
        c.notas as notes,
        (SELECT COALESCE(SUM(cantidad), 0) FROM detalle_compras WHERE compra_id = c.id) as "itemsCount",
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'product', prod.nombre,
              'talla', dc.talla_comprada,
              'cantidad', dc.cantidad,
              'valorUnitario', dc.precio_unitario,
              'total', (dc.cantidad * dc.precio_unitario)
            )
          ) FROM detalle_compras dc
            JOIN productos prod ON dc.producto_id = prod.id
            WHERE dc.compra_id = c.id
          ), '[]'::json
        ) as items
      FROM compras c
      JOIN proveedores p ON c.proveedor_id = p.id
      ORDER BY c.id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Crear una Compra
const crearCompra = async (req, res) => {
  const cliente = await pool.connect();
  try {
    const { supplier, date, notes, status, total, details } = req.body;
    await cliente.query('BEGIN'); // Iniciamos la transacción

    // A. Buscar el ID del Proveedor
    const provResult = await cliente.query('SELECT id FROM proveedores WHERE nombre = $1', [supplier]);
    if (provResult.rows.length === 0) throw new Error('El proveedor seleccionado no existe en la base de datos.');
    const proveedorId = provResult.rows[0].id;

    // B. Crear la Compra Principal
    const compraResult = await cliente.query(
      'INSERT INTO compras (proveedor_id, total, estado, notas, fecha_compra) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [proveedorId, total, status, notes, date || new Date()]
    );
    const nuevaCompraId = compraResult.rows[0].id;

    // C. Guardar los Detalles y Aumentar el Stock
    for (const item of details) {
      // 1. Buscar el ID del Producto
      const prodResult = await cliente.query('SELECT id FROM productos WHERE nombre = $1', [item.product]);
      if (prodResult.rows.length === 0) throw new Error(`El producto ${item.product} no existe.`);
      const productoId = prodResult.rows[0].id;

      // 2. Insertar el detalle de la compra
      await cliente.query(
        'INSERT INTO detalle_compras (compra_id, producto_id, talla_comprada, cantidad, precio_unitario) VALUES ($1, $2, $3, $4, $5)',
        [nuevaCompraId, productoId, item.size, item.quantity, item.unitCost]
      );

      // 3. Aumentar el Inventario (Solo si la compra está "Completada")
      if (status === 'Completado') {
        // Intentamos actualizar la talla. Si la talla no existe, la creamos (UPSERT)
        await cliente.query(`
          INSERT INTO producto_tallas (producto_id, talla, stock) 
          VALUES ($1, $2, $3)
          ON CONFLICT (producto_id, talla) 
          DO UPDATE SET stock = producto_tallas.stock + EXCLUDED.stock, updated_at = CURRENT_TIMESTAMP
        `, [productoId, item.size, item.quantity]);
      }
    }

    await cliente.query('COMMIT'); // Todo salió bien, guardamos los cambios
    res.status(201).json({ message: 'Compra registrada con éxito' });
  } catch (error) {
    await cliente.query('ROLLBACK'); // Algo falló, cancelamos todo para no descuadrar el inventario
    res.status(500).json({ error: error.message });
  } finally {
    cliente.release();
  }
};

// 3. Eliminar una Compra (Anularla)
const eliminarCompra = async (req, res) => {
  const cliente = await pool.connect();
  try {
    const { id } = req.params;
    await cliente.query('BEGIN');

    // Primero verificamos si estaba Completada para restar el stock que habíamos sumado
    const compraInfo = await cliente.query('SELECT estado FROM compras WHERE id = $1', [id]);
    if (compraInfo.rows.length > 0 && compraInfo.rows[0].estado === 'Completado') {
      const detalles = await cliente.query('SELECT producto_id, talla_comprada, cantidad FROM detalle_compras WHERE compra_id = $1', [id]);
      
      for (const item of detalles.rows) {
        await cliente.query(`
          UPDATE producto_tallas 
          SET stock = GREATEST(stock - $1, 0) -- GREATEST evita que el stock quede en negativo
          WHERE producto_id = $2 AND talla = $3
        `, [item.cantidad, item.producto_id, item.talla_comprada]);
      }
    }

    // Eliminamos la compra (esto borra los detalles automáticamente gracias al ON DELETE CASCADE)
    await cliente.query('DELETE FROM compras WHERE id = $1', [id]);

    await cliente.query('COMMIT');
    res.json({ message: 'Compra eliminada y stock revertido' });
  } catch (error) {
    await cliente.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    cliente.release();
  }
};

module.exports = { obtenerCompras, crearCompra, eliminarCompra };