const pool = require('./src/config/db');

const crearTablas = async () => {
  console.log('Creando tablas en la base de datos...');
  
  const sql = `
    CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL UNIQUE,
        descripcion TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        rol_id INT NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_usuario_rol FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS categorias (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS productos (
        id SERIAL PRIMARY KEY,
        categoria_id INT NOT NULL,
        nombre VARCHAR(150) NOT NULL,
        precio DECIMAL(12, 2) NOT NULL CHECK (precio >= 0),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_producto_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS producto_imagenes (
        id SERIAL PRIMARY KEY,
        producto_id INT NOT NULL,
        url_imagen TEXT NOT NULL,
        es_principal BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_imagen_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS producto_tallas (
        id SERIAL PRIMARY KEY,
        producto_id INT NOT NULL,
        talla VARCHAR(10) NOT NULL,
        stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_talla_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
        UNIQUE(producto_id, talla)
    );

    CREATE TABLE IF NOT EXISTS clientes (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        email VARCHAR(150),
        telefono VARCHAR(20) NOT NULL,
        direccion TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ventas (
        id SERIAL PRIMARY KEY,
        codigo_venta VARCHAR(20) NOT NULL UNIQUE,
        cliente_id INT NOT NULL,
        usuario_id INT NOT NULL,
        total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        estado VARCHAR(30) NOT NULL DEFAULT 'Completado',
        fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_venta_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT,
        CONSTRAINT fk_venta_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS detalle_ventas (
        id SERIAL PRIMARY KEY,
        venta_id INT NOT NULL,
        producto_id INT NOT NULL,
        talla_vendida VARCHAR(10) NOT NULL,
        cantidad INT NOT NULL CHECK (cantidad > 0),
        precio_unitario DECIMAL(12, 2) NOT NULL,
        subtotal DECIMAL(12, 2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
        CONSTRAINT fk_detalle_venta FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
        CONSTRAINT fk_detalle_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT
    );

    -- Insertar datos de prueba para Categorías
    INSERT INTO categorias (nombre, descripcion) 
    VALUES 
    ('Deportiva', 'Zapatos para correr y entrenar'), 
    ('Casual', 'Calzado para uso diario')
    ON CONFLICT DO NOTHING;
  `;

  try {
    await pool.query(sql);
    console.log('✅ ¡Todas las tablas y datos de prueba fueron creados con éxito en Render!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando las tablas:', error);
    process.exit(1);
  }
};

crearTablas();