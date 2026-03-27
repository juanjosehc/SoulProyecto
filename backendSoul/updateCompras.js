const pool = require('./src/config/db');

const crearTablasCompras = async () => {
  try {
    console.log('Creando tablas de compras y relacionándolas...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS compras (
          id SERIAL PRIMARY KEY,
          proveedor_id INT NOT NULL,
          total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          estado VARCHAR(30) NOT NULL DEFAULT 'Completado',
          notas TEXT,
          fecha_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_compra_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE RESTRICT
      );

      CREATE TABLE IF NOT EXISTS detalle_compras (
          id SERIAL PRIMARY KEY,
          compra_id INT NOT NULL,
          producto_id INT NOT NULL,
          talla_comprada VARCHAR(10) NOT NULL,
          cantidad INT NOT NULL CHECK (cantidad > 0),
          precio_unitario DECIMAL(12, 2) NOT NULL,
          subtotal DECIMAL(12, 2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
          CONSTRAINT fk_detalle_compra FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE,
          CONSTRAINT fk_detalle_compra_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT
      );
    `);

    console.log('✅ Tablas de compras y detalle creadas y relacionadas con éxito');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando las tablas:', error);
    process.exit(1);
  }
};

crearTablasCompras();