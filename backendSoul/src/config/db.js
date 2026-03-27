const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Esto es OBLIGATORIO para conectarse a Render desde tu PC local
  }
});

// Mensaje de prueba
pool.connect()
  .then(() => console.log('Conexión a PostgreSQL en Render exitosa!'))
  .catch(err => console.error('Error al conectar a PostgreSQL', err.stack));

module.exports = pool;