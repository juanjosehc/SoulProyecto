const pool = require('../config/db');

// 1. Obtener todos los pedidos
const obtenerPedidos = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.codigo_pedido as code,
        p.nombre_cliente as "clientName",
        p.telefono as phone,
        p.direccion_entrega as "deliveryAddress",
        TO_CHAR(p.fecha_entrega, 'YYYY-MM-DD') as "deliveryDate",
        p.observaciones as observations,
        p.estado as "orderStatus",
        p.total,
        p.created_at,
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
        ) as items,
        (SELECT COALESCE(SUM(dp2.cantidad), 0) FROM detalle_pedidos dp2 WHERE dp2.pedido_id = p.id) as "itemsCount"
      FROM pedidos p
      ORDER BY p.id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Crear pedido
const crearPedido = async (req, res) => {
  const cliente = await pool.connect();
  try {
    const { clientName, phone, deliveryDate, deliveryAddress, observations, items, total } = req.body;
    
    await cliente.query('BEGIN');

    // Generar código de pedido
    const countResult = await cliente.query('SELECT COUNT(*) as count FROM pedidos');
    const nextNum = parseInt(countResult.rows[0].count) + 1;
    const codigoPedido = `PED${String(nextNum).padStart(4, '0')}`;

    // Buscar cliente si existe
    let clienteId = null;
    if (req.body.clienteId) {
      clienteId = req.body.clienteId;
    }

    // Insertar pedido
    const pedidoResult = await cliente.query(
      `INSERT INTO pedidos (codigo_pedido, cliente_id, nombre_cliente, telefono, direccion_entrega, fecha_entrega, observaciones, estado, total)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pendiente', $8) RETURNING id`,
      [codigoPedido, clienteId, clientName, phone, deliveryAddress, deliveryDate || new Date(), observations || '', total || 0]
    );
    const pedidoId = pedidoResult.rows[0].id;

    // Insertar detalles
    for (const item of items) {
      const prodResult = await cliente.query('SELECT id FROM productos WHERE nombre = $1', [item.product]);
      if (prodResult.rows.length === 0) throw new Error(`El producto "${item.product}" no existe`);
      const productoId = prodResult.rows[0].id;

      await cliente.query(
        'INSERT INTO detalle_pedidos (pedido_id, producto_id, talla, cantidad, precio_unitario) VALUES ($1, $2, $3, $4, $5)',
        [pedidoId, productoId, item.talla, item.cantidad, item.valorUnitario]
      );
    }

    await cliente.query('COMMIT');
    res.status(201).json({ message: 'Pedido creado exitosamente', code: codigoPedido });
  } catch (error) {
    await cliente.query('ROLLBACK');
    console.error('Error al crear pedido:', error);
    res.status(500).json({ error: error.message });
  } finally {
    cliente.release();
  }
};

// 3. Editar pedido
const editarPedido = async (req, res) => {
  const cliente = await pool.connect();
  try {
    const { id } = req.params;
    const { clientName, phone, deliveryDate, deliveryAddress, observations, items, total } = req.body;

    await cliente.query('BEGIN');

    // Verificar que no esté completado o anulado
    const pedidoActual = await cliente.query('SELECT estado FROM pedidos WHERE id = $1', [id]);
    if (pedidoActual.rows.length === 0) throw new Error('Pedido no encontrado');
    if (pedidoActual.rows[0].estado === 'Completado' || pedidoActual.rows[0].estado === 'Anulado') {
      throw new Error('No se puede editar un pedido completado o anulado');
    }

    // Actualizar pedido principal
    await cliente.query(
      `UPDATE pedidos SET nombre_cliente = $1, telefono = $2, direccion_entrega = $3, fecha_entrega = $4, observaciones = $5, total = $6 WHERE id = $7`,
      [clientName, phone, deliveryAddress, deliveryDate, observations, total, id]
    );

    // Borrar detalles y reinsertar
    await cliente.query('DELETE FROM detalle_pedidos WHERE pedido_id = $1', [id]);

    for (const item of items) {
      const prodResult = await cliente.query('SELECT id FROM productos WHERE nombre = $1', [item.product]);
      if (prodResult.rows.length === 0) throw new Error(`El producto "${item.product}" no existe`);
      const productoId = prodResult.rows[0].id;

      await cliente.query(
        'INSERT INTO detalle_pedidos (pedido_id, producto_id, talla, cantidad, precio_unitario) VALUES ($1, $2, $3, $4, $5)',
        [id, productoId, item.talla, item.cantidad, item.valorUnitario]
      );
    }

    await cliente.query('COMMIT');
    res.json({ message: 'Pedido actualizado exitosamente' });
  } catch (error) {
    await cliente.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    cliente.release();
  }
};

// 4. Cambiar estado del pedido (CON LÓGICA DE NEGOCIO)
const cambiarEstadoPedido = async (req, res) => {
  const cliente = await pool.connect();
  try {
    const { id } = req.params;
    const { estado } = req.body;

    await cliente.query('BEGIN');

    // Obtener pedido actual
    const pedidoResult = await cliente.query(`
      SELECT p.*, 
        (SELECT json_agg(json_build_object('producto_id', dp.producto_id, 'talla', dp.talla, 'cantidad', dp.cantidad, 'precio_unitario', dp.precio_unitario))
         FROM detalle_pedidos dp WHERE dp.pedido_id = p.id) as detalles
      FROM pedidos p WHERE p.id = $1
    `, [id]);

    if (pedidoResult.rows.length === 0) throw new Error('Pedido no encontrado');
    const pedido = pedidoResult.rows[0];

    // Actualizar estado del pedido
    await cliente.query('UPDATE pedidos SET estado = $1 WHERE id = $2', [estado, id]);

    // LÓGICA: Si pasa a "Completado", crear venta automáticamente
    if (estado === 'Completado' && pedido.estado !== 'Completado') {
      // Generar código de venta
      const ventaCount = await cliente.query('SELECT COUNT(*) as count FROM ventas');
      const nextVentaNum = parseInt(ventaCount.rows[0].count) + 1;
      const codigoVenta = `VTA${String(nextVentaNum).padStart(4, '0')}`;

      // Crear venta
      const ventaResult = await cliente.query(
        `INSERT INTO ventas (codigo_venta, cliente_id, total, estado, origen, pedido_id)
         VALUES ($1, $2, $3, 'Completado', 'Pedido', $4) RETURNING id`,
        [codigoVenta, pedido.cliente_id, pedido.total, id]
      );
      const ventaId = ventaResult.rows[0].id;

      // Insertar detalles de venta y descontar stock
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
    res.json({ message: `Pedido actualizado a ${estado}` });
  } catch (error) {
    await cliente.query('ROLLBACK');
    console.error('Error al cambiar estado:', error);
    res.status(500).json({ error: error.message });
  } finally {
    cliente.release();
  }
};

module.exports = { obtenerPedidos, crearPedido, editarPedido, cambiarEstadoPedido };
