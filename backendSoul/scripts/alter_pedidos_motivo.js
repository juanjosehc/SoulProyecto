const pool = require('../src/config/db');

const run = async () => {
  console.log('Agregando columna motivo_anulacion a pedidos...');
  try {
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pedidos' AND column_name='motivo_anulacion') THEN
          ALTER TABLE pedidos ADD COLUMN motivo_anulacion TEXT;
        END IF;
      END $$;
    `);
    console.log('✅ Migración exitosa!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error ejecutando migración:', err);
    process.exit(1);
  }
};

run();
