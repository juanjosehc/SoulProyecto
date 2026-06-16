require('dotenv').config();
const pool = require('../src/config/db');

async function test() {
  try {
    // 1. Columnas de detalle_compras
    const dcInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'detalle_compras'
    `);
    console.log("=== DETALLE COMPRAS COLUMNS ===");
    console.log(dcInfo.rows);

    // 2. Columnas de compras
    const cInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'compras'
    `);
    console.log("=== COMPRAS COLUMNS ===");
    console.log(cInfo.rows);

    // 3. Ver últimas compras y sus detalles
    const compras = await pool.query(`SELECT * FROM compras ORDER BY id DESC LIMIT 2`);
    console.log("=== LAST COMPRAS ===");
    console.log(compras.rows);

    const detalles = await pool.query(`SELECT * FROM detalle_compras ORDER BY id DESC LIMIT 5`);
    console.log("=== LAST DETALLE COMPRAS ===");
    console.log(detalles.rows);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
test();
