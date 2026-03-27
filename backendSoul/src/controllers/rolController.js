const pool = require('../config/db');

// 1. Obtener todos los roles
const obtenerRoles = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.id, r.nombre as name, r.is_active as "isActive",
        COALESCE(
          (SELECT json_agg(json_build_object('id', p.id, 'nombre', p.nombre, 'descripcion', p.descripcion))
           FROM rol_permisos rp
           JOIN permisos p ON rp.permiso_id = p.id
           WHERE rp.rol_id = r.id),
          '[]'::json
        ) as permisos
      FROM roles r 
      ORDER BY r.id ASC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Crear Rol
const crearRol = async (req, res) => {
  const cliente = await pool.connect();
  try {
    // permisos será un array de IDs [1, 5, 8...]
    const { name, permisos } = req.body;
    
    await cliente.query('BEGIN');
    
    // Insertar rol
    const insertRoleResult = await cliente.query(
      'INSERT INTO roles (nombre) VALUES ($1) RETURNING id',
      [name]
    );
    const roleId = insertRoleResult.rows[0].id;
    
    // Insertar relaciones
    if (Array.isArray(permisos) && permisos.length > 0) {
      for (const permisoId of permisos) {
        await cliente.query(
          'INSERT INTO rol_permisos (rol_id, permiso_id) VALUES ($1, $2)',
          [roleId, permisoId]
        );
      }
    }
    
    await cliente.query('COMMIT');
    res.status(201).json({ message: 'Rol creado con éxito' });
  } catch (error) {
    await cliente.query('ROLLBACK');
    if (error.code === '23505') return res.status(400).json({ error: 'Ya existe un rol con ese nombre' });
    res.status(500).json({ error: error.message });
  } finally {
    cliente.release();
  }
};

// 3. Editar Rol
const editarRol = async (req, res) => {
  const cliente = await pool.connect();
  try {
    const { id } = req.params;
    const { name, permisos } = req.body;
    
    if (name === 'Administrador' || id == 1) {
      // Opcional: Proteger el rol admin, pero aquí permitiremos que se editen sus permisos 
      // si así se quiere (o no dejar bajar sus permisos). Como dijiste que se maneja igual que los demás:
      // Solo protegeremos el nombre para que no se renombre el administrador principal
      if (name !== 'Administrador') {
        return res.status(403).json({ error: 'No se puede cambiar el nombre del Administrador principal' });
      }
    }

    await cliente.query('BEGIN');

    await cliente.query('UPDATE roles SET nombre = $1 WHERE id = $2', [name, id]);
    
    // Eliminar permisos antiguos
    await cliente.query('DELETE FROM rol_permisos WHERE rol_id = $1', [id]);
    
    // Insertar nuevos (incluso si es administrador, le pone los seleccionados)
    if (Array.isArray(permisos) && permisos.length > 0) {
      for (const permisoId of permisos) {
        await cliente.query(
          'INSERT INTO rol_permisos (rol_id, permiso_id) VALUES ($1, $2)',
          [id, permisoId]
        );
      }
    }

    await cliente.query('COMMIT');
    res.json({ message: 'Rol actualizado' });
  } catch (error) {
    await cliente.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    cliente.release();
  }
};

// 4. Cambiar Estado
const cambiarEstadoRol = async (req, res) => {
  const cliente = await pool.connect();
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (id == 1) {
      return res.status(403).json({ error: 'No se puede desactivar el rol de Administrador principal' });
    }

    await cliente.query('BEGIN');
    await cliente.query('UPDATE roles SET is_active = $1 WHERE id = $2', [is_active, id]);
    
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

// 6. Obtener catálogo de Permisos
const obtenerPermisosCatalogo = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre, descripcion FROM permisos ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  obtenerRoles, crearRol, editarRol, cambiarEstadoRol, eliminarRol, obtenerPermisosCatalogo
};