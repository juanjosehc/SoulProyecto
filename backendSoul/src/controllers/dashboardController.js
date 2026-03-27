const pool = require('../config/db');

// 1. Estadísticas principales
const obtenerStats = async (req, res) => {
  try {
    // Ventas del día
    const ventasHoy = await pool.query(`
      SELECT COALESCE(SUM(total), 0) as total 
      FROM ventas 
      WHERE DATE(fecha_venta) = CURRENT_DATE AND estado = 'Completado'
    `);

    // Total de ventas
    const ventasTotal = await pool.query(`
      SELECT COALESCE(SUM(total), 0) as total 
      FROM ventas WHERE estado = 'Completado'
    `);

    // Pedidos activos (pendientes o en tránsito)
    const pedidosActivos = await pool.query(`
      SELECT COUNT(*) as count 
      FROM pedidos WHERE estado IN ('Pendiente', 'En tránsito')
    `);

    // Total clientes
    const totalClientes = await pool.query('SELECT COUNT(*) as count FROM clientes WHERE is_active = true');

    res.json({
      ventasHoy: Number(ventasHoy.rows[0].total),
      ventasTotal: Number(ventasTotal.rows[0].total),
      pedidosActivos: Number(pedidosActivos.rows[0].count),
      totalClientes: Number(totalClientes.rows[0].count)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Ventas por día (últimos 7 días)
const obtenerVentasPorDia = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        TO_CHAR(fecha_venta, 'Dy') as name,
        COALESCE(SUM(total), 0) as ventas
      FROM ventas
      WHERE fecha_venta >= CURRENT_DATE - INTERVAL '6 days' AND estado = 'Completado'
      GROUP BY DATE(fecha_venta), TO_CHAR(fecha_venta, 'Dy')
      ORDER BY DATE(fecha_venta)
    `);

    // Si no hay datos, devolver array con días vacíos
    if (result.rows.length === 0) {
      const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      return res.json(dias.map(name => ({ name, ventas: 0 })));
    }

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Productos más vendidos
const obtenerTopProductos = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.nombre as name,
        COALESCE(SUM(dv.cantidad), 0) as cantidad
      FROM detalle_ventas dv
      JOIN productos p ON dv.producto_id = p.id
      JOIN ventas v ON dv.venta_id = v.id
      WHERE v.estado = 'Completado'
      GROUP BY p.nombre
      ORDER BY cantidad DESC
      LIMIT 5
    `);

    // Si no hay datos, devolver lista vacía en lugar de null
    if (result.rows.length === 0) {
      return res.json([{ name: 'Sin datos', cantidad: 0 }]);
    }

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Productos con stock bajo (<10)
const obtenerStockBajo = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.nombre,
        COALESCE(SUM(pt.stock), 0) as stock
      FROM productos p
      LEFT JOIN producto_tallas pt ON p.id = pt.producto_id
      WHERE p.is_active = true
      GROUP BY p.id, p.nombre
      HAVING COALESCE(SUM(pt.stock), 0) < 10
      ORDER BY stock ASC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { obtenerStats, obtenerVentasPorDia, obtenerTopProductos, obtenerStockBajo };
