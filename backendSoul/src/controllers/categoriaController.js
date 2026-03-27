const pool = require('../config/db');

// 1. Obtener todas las categorías
const obtenerCategorias = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categorias ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Crear una nueva categoría
const crearCategoria = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    const result = await pool.query(
      'INSERT INTO categorias (nombre, descripcion) VALUES ($1, $2) RETURNING *',
      [nombre, descripcion]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Editar una categoría
const editarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    const result = await pool.query(
      'UPDATE categorias SET nombre = $1, descripcion = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [nombre, descripcion, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Cambiar estado (CON CASCADA A PRODUCTOS)
const cambiarEstadoCategoria = async (req, res) => {
  const cliente = await pool.connect();
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    await cliente.query('BEGIN');

    // Actualizar estado de la categoría
    await cliente.query(
      'UPDATE categorias SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [is_active, id]
    );

    // CASCADA: Si se desactiva la categoría, desactivar todos sus productos
    if (!is_active) {
      await cliente.query(
        'UPDATE productos SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE categoria_id = $1',
        [id]
      );
    }

    // CASCADA: Si se activa la categoría, activar todos sus productos
    if (is_active) {
      await cliente.query(
        'UPDATE productos SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE categoria_id = $1',
        [id]
      );
    }

    await cliente.query('COMMIT');
    res.json({ 
      message: is_active 
        ? 'Categoría activada' 
        : 'Categoría desactivada y todos sus productos han sido desactivados' 
    });
  } catch (error) {
    await cliente.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    cliente.release();
  }
};

// 5. Eliminar una categoría
const eliminarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM categorias WHERE id = $1', [id]);
    res.json({ message: 'Categoría eliminada con éxito' });
  } catch (error) {
    if (error.code === '23503') { 
      return res.status(400).json({ error: 'No se puede eliminar porque tiene productos asociados.' });
    }
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  obtenerCategorias,
  crearCategoria,
  editarCategoria,
  cambiarEstadoCategoria,
  eliminarCategoria
};