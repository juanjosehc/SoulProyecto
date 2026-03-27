const pool = require('../config/db');

// 1. Obtener todas las ventas (manuales + de pedidos completados + de entregas completadas)
const obtenerVentas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        v.id,
        v.codigo_venta as code,
        COALESCE(c.nombres || ' ' || COALESCE(c.apellidos, ''), v.codigo_venta) as "clientName",
        TO_CHAR(v.fecha_venta, 'YYYY-MM-DD') as "saleDate",
        v.total,
        v.estado as status,
        v.origen as origin,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'product', prod.nombre,
              'talla', dv.talla_vendida,
              'cantidad', dv.cantidad,
              'valorUnitario', dv.precio_unitario,
              'total', dv.subtotal
            )
          ) FROM detalle_ventas dv
            JOIN productos prod ON dv.producto_id = prod.id
            WHERE dv.venta_id = v.id
          ), '[]'::json
        ) as items,
        (SELECT COALESCE(SUM(dv2.cantidad), 0) FROM detalle_ventas dv2 WHERE dv2.venta_id = v.id) as "itemsCount"
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      ORDER BY v.id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Crear venta manual
const crearVenta = async (req, res) => {
  const cliente = await pool.connect();
  try {
    const { clientName, saleDate, paymentMethod, observations, items, total, discount } = req.body;

    await cliente.query('BEGIN');

    // Generar código de venta
    const countResult = await cliente.query('SELECT COUNT(*) as count FROM ventas');
    const nextNum = parseInt(countResult.rows[0].count) + 1;
    const codigoVenta = `VTA${String(nextNum).padStart(4, '0')}`;

    // Buscar cliente por nombre (si existe)
    let clienteId = null;
    const clienteResult = await cliente.query(`SELECT id FROM clientes WHERE nombres || ' ' || COALESCE(apellidos, '') ILIKE $1 LIMIT 1`, [clientName]);
    if (clienteResult.rows.length > 0) {
      clienteId = clienteResult.rows[0].id;
    }

    // Insertar venta
    const ventaResult = await cliente.query(
      `INSERT INTO ventas (codigo_venta, cliente_id, total, estado, origen)
       VALUES ($1, $2, $3, 'Completado', 'Manual') RETURNING id`,
      [codigoVenta, clienteId, total || 0]
    );
    const ventaId = ventaResult.rows[0].id;

    // Insertar detalles y descontar stock (CON VALIDACIÓN)
    for (const item of items) {
      const prodResult = await cliente.query('SELECT id FROM productos WHERE nombre = $1', [item.product]);
      if (prodResult.rows.length === 0) throw new Error(`El producto "${item.product}" no existe`);
      const productoId = prodResult.rows[0].id;

      // Validar stock disponible
      const stockResult = await cliente.query(
        'SELECT stock FROM producto_tallas WHERE producto_id = $1 AND talla = $2',
        [productoId, item.talla]
      );
      if (stockResult.rows.length === 0) {
        throw new Error(`No existe la talla "${item.talla}" para el producto "${item.product}"`);
      }
      if (stockResult.rows[0].stock < item.cantidad) {
        throw new Error(`Stock insuficiente para "${item.product}" talla ${item.talla}. Disponible: ${stockResult.rows[0].stock}, Solicitado: ${item.cantidad}`);
      }

      await cliente.query(
        'INSERT INTO detalle_ventas (venta_id, producto_id, talla_vendida, cantidad, precio_unitario) VALUES ($1, $2, $3, $4, $5)',
        [ventaId, productoId, item.talla, item.cantidad, item.valorUnitario]
      );

      // Descontar stock
      await cliente.query(`
        UPDATE producto_tallas 
        SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP
        WHERE producto_id = $2 AND talla = $3
      `, [item.cantidad, productoId, item.talla]);
    }

    await cliente.query('COMMIT');
    res.status(201).json({ message: 'Venta registrada exitosamente', code: codigoVenta });
  } catch (error) {
    await cliente.query('ROLLBACK');
    console.error('Error al crear venta:', error);
    res.status(500).json({ error: error.message });
  } finally {
    cliente.release();
  }
};

// 3. Anular venta (restaurar stock)
const anularVenta = async (req, res) => {
  const cliente = await pool.connect();
  try {
    const { id } = req.params;

    await cliente.query('BEGIN');

    // Verificar que la venta existe y está activa
    const ventaResult = await cliente.query('SELECT * FROM ventas WHERE id = $1', [id]);
    if (ventaResult.rows.length === 0) throw new Error('Venta no encontrada');
    if (ventaResult.rows[0].estado === 'Anulada') throw new Error('La venta ya está anulada');

    // Obtener detalles para restaurar stock
    const detalles = await cliente.query('SELECT producto_id, talla_vendida, cantidad FROM detalle_ventas WHERE venta_id = $1', [id]);

    for (const item of detalles.rows) {
      await cliente.query(`
        UPDATE producto_tallas 
        SET stock = stock + $1, updated_at = CURRENT_TIMESTAMP
        WHERE producto_id = $2 AND talla = $3
      `, [item.cantidad, item.producto_id, item.talla_vendida]);
    }

    // Marcar como anulada
    await cliente.query('UPDATE ventas SET estado = $1 WHERE id = $2', ['Anulada', id]);

    await cliente.query('COMMIT');
    res.json({ message: 'Venta anulada y stock restaurado' });
  } catch (error) {
    await cliente.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    cliente.release();
  }
};

module.exports = { obtenerVentas, crearVenta, anularVenta };
