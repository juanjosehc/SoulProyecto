const pool = require('../config/db');

// 1. Obtener todos los proveedores
const obtenerProveedores = async (req, res) => {
  try {
    // Mandamos las propiedades dobles para asegurar que cualquier versión de tu Modal funcione
    const result = await pool.query(`
      SELECT 
        id, 
        nit,
        nit as document, 
        nombre as name, 
        contacto as "contactName", 
        contacto as contact,
        email, 
        telefono as phone, 
        ciudad,
        ciudad as city, 
        direccion as address, 
        descripcion,
        descripcion as description,
        descripcion as notes,
        is_active as "isActive" 
      FROM proveedores 
      ORDER BY id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Crear Proveedor
const crearProveedor = async (req, res) => {
  try {
    // Atrapamos el dato sin importar cómo lo haya bautizado el frontend
    const nitFinal = req.body.nit || req.body.document;
    const nombreFinal = req.body.name || req.body.nombre;
    const contactoFinal = req.body.contactName || req.body.contact || req.body.contacto;
    const emailFinal = req.body.email;
    const telefonoFinal = req.body.phone || req.body.telefono;
    const ciudadFinal = req.body.city || req.body.ciudad;
    const direccionFinal = req.body.address || req.body.direccion;
    const descripcionFinal = req.body.description || req.body.descripcion || req.body.notes;

    await pool.query(
      `INSERT INTO proveedores 
      (nit, nombre, contacto, email, telefono, ciudad, direccion, descripcion) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [nitFinal, nombreFinal, contactoFinal, emailFinal, telefonoFinal, ciudadFinal, direccionFinal, descripcionFinal]
    );
    res.status(201).json({ message: 'Proveedor creado con éxito' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Editar Proveedor
const editarProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    
    const nitFinal = req.body.nit || req.body.document;
    const nombreFinal = req.body.name || req.body.nombre;
    const contactoFinal = req.body.contactName || req.body.contact || req.body.contacto;
    const emailFinal = req.body.email;
    const telefonoFinal = req.body.phone || req.body.telefono;
    const ciudadFinal = req.body.city || req.body.ciudad;
    const direccionFinal = req.body.address || req.body.direccion;
    const descripcionFinal = req.body.description || req.body.descripcion || req.body.notes;

    await pool.query(
      `UPDATE proveedores SET 
        nit = $1, nombre = $2, contacto = $3, email = $4, 
        telefono = $5, ciudad = $6, direccion = $7, descripcion = $8 
      WHERE id = $9`,
      [nitFinal, nombreFinal, contactoFinal, emailFinal, telefonoFinal, ciudadFinal, direccionFinal, descripcionFinal, id]
    );
    res.json({ message: 'Proveedor actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Cambiar Estado
const cambiarEstadoProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    await pool.query('UPDATE proveedores SET is_active = $1 WHERE id = $2', [is_active, id]);
    res.json({ message: 'Estado actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5. Eliminar Proveedor
const eliminarProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM proveedores WHERE id = $1', [id]);
    res.json({ message: 'Proveedor eliminado' });
  } catch (error) {
    if (error.code === '23503') return res.status(400).json({ error: 'No se puede eliminar porque tiene compras asociadas.' });
    res.status(500).json({ error: error.message });
  }
};

// 6. Buscar proveedores (autocomplete)
const buscarProveedores = async (req, res) => {
  try {
    const { q } = req.query;
    const result = await pool.query(
      `SELECT id, nombre as name FROM proveedores WHERE is_active = true AND nombre ILIKE $1 ORDER BY nombre LIMIT 20`,
      [`%${q || ''}%`]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  obtenerProveedores, crearProveedor, editarProveedor, cambiarEstadoProveedor, eliminarProveedor, buscarProveedores
};