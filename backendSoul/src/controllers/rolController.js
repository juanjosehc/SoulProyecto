const pool = require('../config/db');

// 1. Obtener todos los roles
const obtenerRoles = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre as name, is_active as "isActive", permisos FROM roles ORDER BY id ASC');
    const rolesLimpios = result.rows.map(rol => ({
      ...rol,
      permisos: rol.permisos || []
    }));
    res.json(rolesLimpios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Crear Rol
const crearRol = async (req, res) => {
  try {
    const { name, permisos } = req.body;
    await pool.query(
      'INSERT INTO roles (nombre, permisos) VALUES ($1, $2)',
      [name, permisos]
    );
    res.status(201).json({ message: 'Rol creado con éxito' });
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ error: 'Ya existe un rol con ese nombre' });
    res.status(500).json({ error: error.message });
  }
};

// 3. Editar Rol
const editarRol = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, permisos } = req.body;
    
    // Protección: Evitar que alguien le quite permisos al Administrador base
    if (name === 'Administrador' || id == 1) {
      return res.status(403).json({ error: 'No se puede editar el rol de Administrador principal' });
    }

    await pool.query(
      'UPDATE roles SET nombre = $1, permisos = $2 WHERE id = $3', 
      [name, permisos, id]
    );
    res.json({ message: 'Rol actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Cambiar Estado (CON CASCADA A USUARIOS)
const cambiarEstadoRol = async (req, res) => {
  const cliente = await pool.connect();
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    // Proteger el rol Administrador (id=1)
    if (id == 1) {
      return res.status(403).json({ error: 'No se puede desactivar el rol de Administrador principal' });
    }

    await cliente.query('BEGIN');

    // Actualizar estado del rol
    await cliente.query('UPDATE roles SET is_active = $1 WHERE id = $2', [is_active, id]);

    // CASCADA: Si se desactiva el rol, desactivar todos los usuarios con ese rol
    if (!is_active) {
      await cliente.query('UPDATE usuarios SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE rol_id = $1', [id]);
    }

    await cliente.query('COMMIT');
    res.json({ message: is_active ? 'Rol activado' : 'Rol desactivado y todos sus usuarios han sido desactivados' });
  } catch (error) {
    await cliente.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    cliente.release();
  }
};

// 5. Eliminar Rol
const eliminarRol = async (req, res) => {
  try {
    const { id } = req.params;

    if (id == 1) {
      return res.status(403).json({ error: 'No se puede eliminar el rol de Administrador principal' });
    }

    await pool.query('DELETE FROM roles WHERE id = $1', [id]);
    res.json({ message: 'Rol eliminado' });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({ error: 'No se puede eliminar porque hay usuarios asignados a este rol.' });
    }
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  obtenerRoles, crearRol, editarRol, cambiarEstadoRol, eliminarRol
};