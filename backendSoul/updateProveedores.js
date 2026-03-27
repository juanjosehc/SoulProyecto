const pool = require('./src/config/db');

const crearTablaProveedores = async () => {
  try {
    console.log('Creando tabla de proveedores...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS proveedores (
          id SERIAL PRIMARY KEY,
          nombre VARCHAR(150) NOT NULL,
          contacto VARCHAR(150),
          email VARCHAR(100),
          telefono VARCHAR(20),
          direccion TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Tabla de proveedores creada con éxito');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando la tabla:', error);
    process.exit(1);
  }
};

crearTablaProveedores();