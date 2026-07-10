const pool = require('../src/config/db');
const bcrypt = require('bcrypt');

const permisosData = [
  { nombre: 'MODULO_DASHBOARD', descripcion: 'Dashboard' },
  { nombre: 'MODULO_ROLES', descripcion: 'Roles y Permisos' },
  { nombre: 'MODULO_USUARIOS', descripcion: 'Usuarios' },
  { nombre: 'MODULO_CATEGORIAS', descripcion: 'Categorías' },
  { nombre: 'MODULO_PRODUCTOS', descripcion: 'Productos' },
  { nombre: 'MODULO_PROVEEDORES', descripcion: 'Proveedores' },
  { nombre: 'MODULO_COMPRAS', descripcion: 'Compras' },
  { nombre: 'MODULO_CLIENTES', descripcion: 'Clientes' },
  { nombre: 'MODULO_PEDIDOS', descripcion: 'Pedidos' },
  { nombre: 'MODULO_VENTAS', descripcion: 'Ventas' },
  { nombre: 'MODULO_ENTREGAS', descripcion: 'Entregas' }
];

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Asumir que las tablas ya existen en la base de datos modelada.
    // Este script solo inserta/actualiza datos (roles, permisos, rol_permisos, usuarios).

    // Asegurar que exista el rol con id = 1 y nombre Administrador
    const roleCheck = await client.query('SELECT id, nombre FROM roles WHERE id = 1');
    if (roleCheck.rows.length === 0) {
      // Intentar insertar con id explícito
      try {
        await client.query("INSERT INTO roles (id, nombre, descripcion, is_active) VALUES (1, $1, $2, TRUE)", ['Administrador', 'Rol administrador del sistema']);
      } catch (err) {
        // Si falla (ej. por secuencia), insertar/upsert por nombre
        await client.query("INSERT INTO roles (nombre, descripcion, is_active) VALUES ($1, $2, TRUE) ON CONFLICT (nombre) DO UPDATE SET descripcion = EXCLUDED.descripcion", ['Administrador', 'Rol administrador del sistema']);
      }
    } else {
      // Actualizar nombre si es distinto
      if (roleCheck.rows[0].nombre !== 'Administrador') {
        await client.query("UPDATE roles SET nombre = $1, descripcion = $2, is_active = TRUE WHERE id = 1", ['Administrador', 'Rol administrador del sistema']);
      }
    }

    // Asegurar que la secuencia de roles esté alineada
    await client.query("SELECT setval(pg_get_serial_sequence('roles','id'), COALESCE((SELECT MAX(id) FROM roles), 1), true)");

    // Insertar/actualizar permisos
    const permisoIds = [];
    for (const p of permisosData) {
      const res = await client.query(
        `INSERT INTO permisos (nombre, descripcion)
         VALUES ($1, $2)
         ON CONFLICT (nombre) DO UPDATE SET descripcion = EXCLUDED.descripcion
         RETURNING id`,
        [p.nombre, p.descripcion]
      );
      permisoIds.push(res.rows[0].id);
    }

    // Alinear secuencia de permisos
    await client.query("SELECT setval(pg_get_serial_sequence('permisos','id'), COALESCE((SELECT MAX(id) FROM permisos), 1), true)");

    // Asignar todos los permisos al rol 1
    for (const pid of permisoIds) {
      await client.query(
        `INSERT INTO rol_permisos (rol_id, permiso_id)
         VALUES (1, $1)
         ON CONFLICT (rol_id, permiso_id) DO NOTHING`,
        [pid]
      );
    }

    // Alinear secuencia rol_permisos
    await client.query("SELECT setval(pg_get_serial_sequence('rol_permisos','id'), COALESCE((SELECT MAX(id) FROM rol_permisos), 1), true)");

    // Crear o actualizar usuario admin
    const adminEmail = 'admin@soul.com';
    const adminPassword = 'admin123';
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const userRes = await client.query('SELECT id FROM usuarios WHERE email = $1', [adminEmail]);
    if (userRes.rows.length === 0) {
      await client.query(
        `INSERT INTO usuarios (rol_id, nombre, email, password_hash, is_active)
         VALUES (1, $1, $2, $3, TRUE)`,
        ['Administrador', adminEmail, passwordHash]
      );
    } else {
      await client.query(
        `UPDATE usuarios SET rol_id = 1, nombre = $1, password_hash = $2, is_active = TRUE WHERE email = $3`,
        ['Administrador', passwordHash, adminEmail]
      );
    }

    // Alinear secuencia usuarios
    await client.query("SELECT setval(pg_get_serial_sequence('usuarios','id'), COALESCE((SELECT MAX(id) FROM usuarios), 1), true)");

    await client.query('COMMIT');
    console.log('Inicialización completada: rol, permisos y usuario admin creados/actualizados.');
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error inicializando datos:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

run();
