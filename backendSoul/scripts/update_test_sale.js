require('dotenv').config();
const pool = require('../src/config/db');

async function test() {
  try {
    const res = await pool.query(
      "UPDATE ventas SET motivo_anulacion = 'Cliente solicitó reembolso por color incorrecto' WHERE id = (SELECT id FROM ventas WHERE estado = 'Anulada' ORDER BY id DESC LIMIT 1) RETURNING id, codigo_venta, estado, motivo_anulacion"
    );
    console.log('Venta actualizada:', res.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
