const pool = require('./src/config/db');

const actualizarTabla = async () => {
  try {
    console.log('Agregando columnas faltantes a Proveedores...');
    
    await pool.query(`
      ALTER TABLE proveedores 
      ADD COLUMN IF NOT EXISTS nit VARCHAR(50),
      ADD COLUMN IF NOT EXISTS ciudad VARCHAR(100),
      ADD COLUMN IF NOT EXISTS descripcion TEXT;
    `);

    console.log('✅ Columnas NIT, Ciudad y Descripción agregadas con éxito');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error actualizando la tabla:', error);
    process.exit(1);
  }
};

actualizarTabla();