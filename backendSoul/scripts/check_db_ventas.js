require('dotenv').config();
const pool = require('../src/config/db');

async function test() {
  try {
    const res = await pool.query('SELECT id, codigo_venta, estado, motivo_anulacion FROM ventas ORDER BY id DESC LIMIT 5');
    console.log(res.rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
