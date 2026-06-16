const pool = require('../config/db');

// 1. Obtener entregas (pedidos en estado "En tránsito")
const obtenerEntregas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.codigo_pedido as "orderCode",
        p.nombre_cliente as "clientName",
        p.telefono as phone,
        p.direccion_entrega as address,
        TO_CHAR(p.fecha_entrega, 'YYYY-MM-DD') as date,
        p.estado as status,
        p.total,
        p.observaciones as notes,
        u.nombre as "deliveryPerson",
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'product', prod.nombre,
              'talla', dp.talla,
              'cantidad', dp.cantidad,
              'valorUnitario', dp.precio_unitario,
              'total', dp.subtotal
            )
          ) FROM detalle_pedidos dp
            JOIN productos prod ON dp.producto_id = prod.id
            WHERE dp.pedido_id = p.id
          ), '[]'::json
        ) as items
      FROM pedidos p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      WHERE p.estado = 'En tránsito'
      ORDER BY p.id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Cambiar estado de entrega (Sincroniza con motivo de anulación)
const cambiarEstadoEntrega = async (req, res) => {
  const cliente = await pool.connect();
  try {
    const { id } = req.params;
    const { estado, motivo_anulacion } = req.body;

    await cliente.query('BEGIN');

    // Obtener pedido
    const pedidoResult = await cliente.query(`
      SELECT p.*, 
        (SELECT json_agg(json_build_object('producto_id', dp.producto_id, 'talla', dp.talla, 'cantidad', dp.cantidad, 'precio_unitario', dp.precio_unitario))
         FROM detalle_pedidos dp WHERE dp.pedido_id = p.id) as detalles
      FROM pedidos p WHERE p.id = $1
    `, [id]);

    if (pedidoResult.rows.length === 0) throw new Error('Pedido no encontrado');
    const pedido = pedidoResult.rows[0];

    // Actualizar estado del pedido (y motivo de anulación si aplica)
    if (estado === 'Anulado') {
      await cliente.query('UPDATE pedidos SET estado = $1, motivo_anulacion = $2 WHERE id = $3', [estado, motivo_anulacion || '', id]);
    } else {
      await cliente.query('UPDATE pedidos SET estado = $1 WHERE id = $2', [estado, id]);
    }

    // LÓGICA: Si pasa a "Completado", crear venta automáticamente
    if (estado === 'Completado') {
      const ventaCount = await cliente.query('SELECT COUNT(*) as count FROM ventas');
      const nextVentaNum = parseInt(ventaCount.rows[0].count) + 1;
      const codigoVenta = `VTA${String(nextVentaNum).padStart(4, '0')}`;

      const ventaResult = await cliente.query(
        `INSERT INTO ventas (codigo_venta, cliente_id, total, estado, origen, pedido_id)
         VALUES ($1, $2, $3, 'Completado', 'Entrega', $4) RETURNING id`,
        [codigoVenta, pedido.cliente_id, pedido.total, id]
      );
      const ventaId = ventaResult.rows[0].id;

      if (pedido.detalles) {
        for (const item of pedido.detalles) {
          await cliente.query(
            'INSERT INTO detalle_ventas (venta_id, producto_id, talla_vendida, cantidad, precio_unitario) VALUES ($1, $2, $3, $4, $5)',
            [ventaId, item.producto_id, item.talla, item.cantidad, item.precio_unitario]
          );

          // Descontar stock
          await cliente.query(`
            UPDATE producto_tallas 
            SET stock = GREATEST(stock - $1, 0), updated_at = CURRENT_TIMESTAMP
            WHERE producto_id = $2 AND talla = $3
          `, [item.cantidad, item.producto_id, item.talla]);
        }
      }
    }

    await cliente.query('COMMIT');
    res.json({ message: `Entrega actualizada a ${estado}` });
  } catch (error) {
    await cliente.query('ROLLBACK');
    console.error('Error al cambiar estado de entrega:', error);
    res.status(500).json({ error: error.message });
  } finally {
    cliente.release();
  }
};

// 3. Obtener historial exclusivo de entregas asignadas al domiciliario logueado
const obtenerHistorialEntrega = async (req, res) => {
  try {
    const domiciliarioId = req.user.id;
    const result = await pool.query(`
      SELECT 
        p.id,
        p.codigo_pedido as "orderCode",
        p.nombre_cliente as "clientName",
        p.telefono as phone,
        p.direccion_entrega as address,
        TO_CHAR(p.fecha_entrega, 'YYYY-MM-DD') as date,
        p.estado as status,
        p.total,
        p.observaciones as notes,
        p.motivo_anulacion as "motivoAnulacion",
        u.nombre as "deliveryPerson",
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'product', prod.nombre,
              'talla', dp.talla,
              'cantidad', dp.cantidad,
              'valorUnitario', dp.precio_unitario,
              'total', dp.subtotal
            )
          ) FROM detalle_pedidos dp
            JOIN productos prod ON dp.producto_id = prod.id
            WHERE dp.pedido_id = p.id
          ), '[]'::json
        ) as items
      FROM pedidos p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      WHERE p.usuario_id = $1 AND p.estado != 'Pendiente'
      ORDER BY p.id DESC
    `, [domiciliarioId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { obtenerEntregas, cambiarEstadoEntrega, obtenerHistorialEntrega };
