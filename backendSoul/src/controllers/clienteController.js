const pool = require('../config/db');

// Obtener todos los clientes
const obtenerClientes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, nombres, apellidos, correo, telefono, direccion, is_active as estado,
             created_at, updated_at
      FROM clientes ORDER BY id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crear un nuevo cliente
const crearCliente = async (req, res) => {
  const nombres = req.body.nombres || req.body.nombre || req.body.name;
  const apellidos = req.body.apellidos || '';
  const correo = req.body.correo || req.body.email;
  const telefono = req.body.telefono || req.body.phone;
  const direccion = req.body.direccion || req.body.address;

  if (!nombres) {
    return res.status(400).json({ error: "El campo nombre es obligatorio." });
  }

  try {
    const result = await pool.query(
      'INSERT INTO clientes (nombres, apellidos, correo, telefono, direccion) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nombres, apellidos, correo, telefono, direccion]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ error: 'Ya existe un cliente con este correo' });
    res.status(500).json({ error: error.message });
  }
};

// Actualizar un cliente existente
const actualizarCliente = async (req, res) => {
  const { id } = req.params;
  const nombres = req.body.nombres || req.body.nombre || req.body.name;
  const apellidos = req.body.apellidos || '';
  const correo = req.body.correo || req.body.email;
  const telefono = req.body.telefono || req.body.phone;
  const direccion = req.body.direccion || req.body.address;

  try {
    const result = await pool.query(
      'UPDATE clientes SET nombres = $1, apellidos = $2, correo = $3, telefono = $4, direccion = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [nombres, apellidos, correo, telefono, direccion, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Cliente no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cambiar estado (activo/inactivo)
const cambiarEstadoCliente = async (req, res) => {
  const { id } = req.params;
  const is_active = req.body.is_active !== undefined ? req.body.is_active : req.body.estado;

  try {
    const result = await pool.query(
      'UPDATE clientes SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [is_active, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Cliente no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar un cliente
const eliminarCliente = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM clientes WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Cliente no encontrado' });
    res.json({ message: 'Cliente eliminado correctamente' });
  } catch (error) {
    if (error.code === '23503') return res.status(400).json({ error: 'No se puede eliminar porque tiene pedidos o ventas asociadas.' });
    res.status(500).json({ error: error.message });
  }
};

// Buscar clientes (autocomplete)
const buscarClientes = async (req, res) => {
  try {
    const { q } = req.query;
    const result = await pool.query(
      `SELECT id, nombres, apellidos, correo, telefono FROM clientes WHERE is_active = true AND (nombres || ' ' || COALESCE(apellidos, '')) ILIKE $1 ORDER BY nombres LIMIT 20`,
      [`%${q || ''}%`]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  obtenerClientes,
  crearCliente,
  actualizarCliente,
  cambiarEstadoCliente,
  eliminarCliente,
  buscarClientes
};