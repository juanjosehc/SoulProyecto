const pool = require('../config/db');
const bcrypt = require('bcrypt');

// 1. Obtener todos los usuarios
const obtenerUsuarios = async (req, res) => {
  try {
    const sql = `
      SELECT u.id, u.nombre as name, u.email, r.nombre as role, u.is_active as "isActive"
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      ORDER BY u.id DESC;
    `;
    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Crear Usuario
const crearUsuario = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;

    const rolResult = await pool.query('SELECT id FROM roles WHERE nombre = $1', [role]);
    if (rolResult.rows.length === 0) return res.status(400).json({ error: 'Rol no válido' });
    const rolId = rolResult.rows[0].id;

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    await pool.query(
      'INSERT INTO usuarios (rol_id, nombre, email, password_hash) VALUES ($1, $2, $3, $4)',
      [rolId, name, email, passwordHash]
    );

    res.status(201).json({ message: 'Usuario creado con éxito' });
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ error: 'El correo ya está registrado' });
    res.status(500).json({ error: error.message });
  }
};

// 3. Editar Usuario
const editarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, password } = req.body;

    const rolResult = await pool.query('SELECT id FROM roles WHERE nombre = $1', [role]);
    const rolId = rolResult.rows[0].id;

    if (password && password.trim() !== '') {
      const passwordHash = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE usuarios SET rol_id = $1, nombre = $2, email = $3, password_hash = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5',
        [rolId, name, email, passwordHash, id]
      );
    } else {
      await pool.query(
        'UPDATE usuarios SET rol_id = $1, nombre = $2, email = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
        [rolId, name, email, id]
      );
    }

    res.json({ message: 'Usuario actualizado' });
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ error: 'El correo ya está en uso por otro usuario' });
    res.status(500).json({ error: error.message });
  }
};

// 4. Cambiar Estado (PROTEGER ADMIN)
const cambiarEstadoUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    // Proteger al usuario administrador principal
    if (!is_active) {
      const userResult = await pool.query(`
        SELECT u.id, r.nombre as rol FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.id = $1
      `, [id]);

      if (userResult.rows.length > 0) {
        // No permitir desactivar al primer admin
        if (userResult.rows[0].rol === 'Administrador') {
          // Contar cuántos admins activos quedan
          const adminCount = await pool.query(`
            SELECT COUNT(*) as count FROM usuarios u JOIN roles r ON u.rol_id = r.id 
            WHERE r.nombre = 'Administrador' AND u.is_active = true
          `);
          if (parseInt(adminCount.rows[0].count) <= 1) {
            return res.status(403).json({ error: 'No se puede desactivar al único administrador del sistema' });
          }
        }
      }
    }

    await pool.query('UPDATE usuarios SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [is_active, id]);
    res.json({ message: 'Estado actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5. Eliminar
const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    if (error.code === '23503') return res.status(400).json({ error: 'No se puede eliminar porque este usuario ha registrado ventas.' });
    res.status(500).json({ error: error.message });
  }
};

// 6. Buscar domiciliarios activos (autocomplete)
const buscarDomiciliarios = async (req, res) => {
  try {
    const { q } = req.query;
    const result = await pool.query(
      `SELECT u.id, u.nombre as name, u.email
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE r.nombre = 'Domiciliario' AND u.is_active = true AND r.is_active = true
       AND u.nombre ILIKE $1
       ORDER BY u.nombre LIMIT 20`,
      [`%${q || ''}%`]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  obtenerUsuarios, crearUsuario, editarUsuario, cambiarEstadoUsuario, eliminarUsuario, buscarDomiciliarios
};