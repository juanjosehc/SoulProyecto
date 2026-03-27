require('dotenv').config();
const pool = require('../src/config/db');

const up = async () => {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    console.log('Iniciando migración para recuperación de contraseñas...');

    // 1. Alterar tabla usuarios
    console.log('Agregando columnas a la tabla usuarios...');
    await cliente.query(`
      ALTER TABLE usuarios 
      ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP;
    `);

    // 2. Alterar tabla clientes
    console.log('Agregando columnas a la tabla clientes...');
    await cliente.query(`
      ALTER TABLE clientes 
      ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP;
    `);

    await cliente.query('COMMIT');
    console.log('✅ Migración completada exitosamente.');
  } catch (error) {
    await cliente.query('ROLLBACK');
    console.error('❌ Error en la migración:', error);
  } finally {
    cliente.release();
    pool.end();
  }
};

up();
