const pool = require('./src/config/db');

const actualizarTablaClientes = async () => {
  try {
    console.log('Iniciando actualización de la tabla de clientes...');
    
    // Estos campos reflejan la estructura típica del modal, adaptados a tu BD
    const alterQuery = `
      ALTER TABLE clientes 
      ADD COLUMN IF NOT EXISTS nombre VARCHAR(100) NOT NULL,
      ADD COLUMN IF NOT EXISTS correo VARCHAR(100) UNIQUE NOT NULL,
      ADD COLUMN IF NOT EXISTS telefono VARCHAR(20),
      ADD COLUMN IF NOT EXISTS direccion TEXT,
      ADD COLUMN IF NOT EXISTS estado BOOLEAN DEFAULT true;
    `;
    
    await pool.query(alterQuery);
    console.log('¡Tabla de clientes actualizada con éxito!');
  } catch (error) {
    console.error('Error actualizando la tabla de clientes:', error);
  } finally {
    pool.end();
  }
};

actualizarTablaClientes();