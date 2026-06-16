const pool = require('../src/config/db');

const run = async () => {
  console.log('Creando tabla de carrito y agregando precio_venta a detalle_compras...');
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS carrito (
          id SERIAL PRIMARY KEY,
          cliente_id INT NOT NULL,
          producto_id INT NOT NULL,
          talla VARCHAR(10) NOT NULL,
          cantidad INT NOT NULL CHECK (cantidad > 0),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_carrito_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
          CONSTRAINT fk_carrito_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
          UNIQUE(cliente_id, producto_id, talla)
      );

      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='detalle_compras' AND column_name='precio_venta') THEN
          ALTER TABLE detalle_compras ADD COLUMN precio_venta DECIMAL(12, 2) DEFAULT 0.00;
        END IF;
      END $$;
    `);
    console.log('✅ Migración carrito y compras completada exitosamente!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en la migración:', err);
    process.exit(1);
  }
};

run();
