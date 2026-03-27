/**
 * SOUL - Migración de Base de Datos
 * Ejecutar con: node migrateDb.js
 * 
 * Cambios:
 * 1. Modifica tabla clientes (agrega apellidos, password_hash, renombra columnas)
 * 2. Crea tabla pedidos
 * 3. Crea tabla detalle_pedidos
 * 4. Agrega columna genero a productos
 * 5. Agrega campo origen a ventas (para rastrear si viene de pedido, entrega o manual)
 */

const pool = require('./src/config/db');

const migrar = async () => {
  console.log('🔄 Iniciando migración de la base de datos SOUL...\n');

  const sql = `
    -- ============================================
    -- 1. MODIFICAR TABLA CLIENTES
    -- ============================================
    
    -- Agregar columna apellidos si no existe
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='apellidos') THEN
        ALTER TABLE clientes ADD COLUMN apellidos VARCHAR(150) DEFAULT '';
      END IF;
    END $$;

    -- Agregar columna password_hash si no existe
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='password_hash') THEN
        ALTER TABLE clientes ADD COLUMN password_hash VARCHAR(255);
      END IF;
    END $$;

    -- Renombrar columna nombre a nombres (solo si 'nombre' existe Y 'nombres' NO existe)
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='nombre')
         AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='nombres') THEN
        ALTER TABLE clientes RENAME COLUMN nombre TO nombres;
      END IF;
    END $$;

    -- Si no existe la columna 'nombres', crearla
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='nombres') THEN
        ALTER TABLE clientes ADD COLUMN nombres VARCHAR(150) NOT NULL DEFAULT '';
      END IF;
    END $$;

    -- Renombrar columna email a correo (solo si 'email' existe Y 'correo' NO existe)
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='email')
         AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='correo') THEN
        ALTER TABLE clientes RENAME COLUMN email TO correo;
      END IF;
    END $$;

    -- Si no existe la columna 'correo', crearla
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='correo') THEN
        ALTER TABLE clientes ADD COLUMN correo VARCHAR(150);
      END IF;
    END $$;

    -- ============================================
    -- 2. CREAR TABLA PEDIDOS
    -- ============================================
    CREATE TABLE IF NOT EXISTS pedidos (
      id SERIAL PRIMARY KEY,
      codigo_pedido VARCHAR(20) NOT NULL UNIQUE,
      cliente_id INT,
      usuario_id INT,
      nombre_cliente VARCHAR(200) NOT NULL,
      telefono VARCHAR(20),
      direccion_entrega TEXT,
      fecha_entrega DATE,
      observaciones TEXT,
      estado VARCHAR(30) NOT NULL DEFAULT 'Pendiente',
      total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_pedido_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
      CONSTRAINT fk_pedido_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
    );

    -- ============================================
    -- 3. CREAR TABLA DETALLE_PEDIDOS
    -- ============================================
    CREATE TABLE IF NOT EXISTS detalle_pedidos (
      id SERIAL PRIMARY KEY,
      pedido_id INT NOT NULL,
      producto_id INT NOT NULL,
      talla VARCHAR(10) NOT NULL,
      cantidad INT NOT NULL CHECK (cantidad > 0),
      precio_unitario DECIMAL(12, 2) NOT NULL,
      subtotal DECIMAL(12, 2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
      CONSTRAINT fk_detalle_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
      CONSTRAINT fk_detalle_pedido_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT
    );

    -- ============================================
    -- 4. AGREGAR CAMPO GENERO A PRODUCTOS
    -- ============================================
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos' AND column_name='genero') THEN
        ALTER TABLE productos ADD COLUMN genero VARCHAR(20) DEFAULT 'Unisex';
      END IF;
    END $$;

    -- ============================================
    -- 5. AGREGAR CAMPO ORIGEN A VENTAS
    -- ============================================
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ventas' AND column_name='origen') THEN
        ALTER TABLE ventas ADD COLUMN origen VARCHAR(30) DEFAULT 'Manual';
      END IF;
    END $$;

    -- Agregar campo pedido_id a ventas para rastrear de qué pedido viene
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ventas' AND column_name='pedido_id') THEN
        ALTER TABLE ventas ADD COLUMN pedido_id INT;
      END IF;
    END $$;

    -- Hacer cliente_id nullable en ventas (para ventas manuales sin cliente registrado)
    ALTER TABLE ventas ALTER COLUMN cliente_id DROP NOT NULL;

    -- Hacer usuario_id nullable en ventas (para ventas auto-generadas)
    ALTER TABLE ventas ALTER COLUMN usuario_id DROP NOT NULL;

    -- ============================================
    -- 6. AGREGAR COLUMNA PERMISOS A ROLES (si no existe)
    -- ============================================
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='roles' AND column_name='permisos') THEN
        ALTER TABLE roles ADD COLUMN permisos TEXT[] DEFAULT '{}';
      END IF;
    END $$;

    -- ============================================
    -- 7. INSERTAR ROL Y USUARIO ADMIN POR DEFECTO
    -- ============================================
    INSERT INTO roles (nombre, descripcion, permisos)
    VALUES ('Administrador', 'Acceso total al sistema', '{"dashboard","roles","usuarios","categorias","productos","proveedores","compras","clientes","pedidos","ventas","entregas"}')
    ON CONFLICT (nombre) DO NOTHING;

  `;

  try {
    await pool.query(sql);
    console.log('✅ Migración completada exitosamente!\n');
    console.log('📋 Cambios realizados:');
    console.log('   • Tabla clientes: agregado apellidos, password_hash, renombrado nombre→nombres, email→correo');
    console.log('   • Tabla pedidos: CREADA');
    console.log('   • Tabla detalle_pedidos: CREADA');
    console.log('   • Tabla productos: agregado campo genero');
    console.log('   • Tabla ventas: agregado campos origen y pedido_id');
    console.log('   • Tabla roles: verificado campo permisos');
    console.log('   • Rol Administrador: insertado si no existía\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la migración:', error.message);
    process.exit(1);
  }
};

migrar();
