require('dotenv').config();
const pool = require('../src/config/db');

const PERMISOS = [
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

const MAPA_ANTIGUO = {
  'dashboard': 'MODULO_DASHBOARD',
  'roles y permisos': 'MODULO_ROLES',
  'usuarios': 'MODULO_USUARIOS',
  'categorías': 'MODULO_CATEGORIAS',
  'categorias': 'MODULO_CATEGORIAS',
  'productos': 'MODULO_PRODUCTOS',
  'proveedores': 'MODULO_PROVEEDORES',
  'compras': 'MODULO_COMPRAS',
  'clientes': 'MODULO_CLIENTES',
  'pedidos': 'MODULO_PEDIDOS',
  'ventas': 'MODULO_VENTAS',
  'entregas': 'MODULO_ENTREGAS'
};

const migrarBaseDeDatos = async () => {
  const cliente = await pool.connect();
  
  try {
    await cliente.query('BEGIN');
    console.log('Iniciando migración de base de datos...');

    console.log('1. Creando tablas permisos y rol_permisos...');
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS permisos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(50) UNIQUE NOT NULL,
        descripcion VARCHAR(150) NOT NULL
      );
    `);

    await cliente.query(`
      CREATE TABLE IF NOT EXISTS rol_permisos (
        id SERIAL PRIMARY KEY,
        rol_id INT REFERENCES roles(id) ON DELETE CASCADE,
        permiso_id INT REFERENCES permisos(id) ON DELETE CASCADE,
        UNIQUE(rol_id, permiso_id)
      );
    `);

    console.log('2. Insertando catálogo base de permisos...');
    for (const permiso of PERMISOS) {
      await cliente.query(
        'INSERT INTO permisos (nombre, descripcion) VALUES ($1, $2) ON CONFLICT (nombre) DO NOTHING',
        [permiso.nombre, permiso.descripcion]
      );
    }

    const dbPermisosResult = await cliente.query('SELECT id, nombre FROM permisos');
    const permisosMap = {}; 
    dbPermisosResult.rows.forEach(p => permisosMap[p.nombre] = p.id);
    const todosLosIds = Object.values(permisosMap);

    console.log('3. Extrayendo roles y migrando sus relaciones de permisos...');
    const tableInfo = await cliente.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='roles' and column_name='permisos';
    `);
    
    if (tableInfo.rows.length > 0) {
      const rolesResult = await cliente.query('SELECT id, nombre, permisos FROM roles');
      const rolesToMigrate = rolesResult.rows;

      for (const rol of rolesToMigrate) {
        await cliente.query('DELETE FROM rol_permisos WHERE rol_id = $1', [rol.id]);

        if (rol.id === 1 || rol.nombre.toLowerCase() === 'administrador') {
          for (const permisoId of todosLosIds) {
            await cliente.query(
              'INSERT INTO rol_permisos (rol_id, permiso_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
              [rol.id, permisoId]
            );
          }
          console.log(`   - Rol Administrador (id:${rol.id}): Asignados ${todosLosIds.length} módulos.`);
        } else {
          let antiguosPermisos = [];
          if (Array.isArray(rol.permisos)) {
            antiguosPermisos = rol.permisos;
          } else if (typeof rol.permisos === 'string') {
            try { antiguosPermisos = JSON.parse(rol.permisos); } catch(e) {}
          }
          
          let mapeadosCount = 0;
          for (let stringPermiso of antiguosPermisos) {
            if (!stringPermiso) continue;
            const cleanStr = stringPermiso.trim().toLowerCase();
            const nuevoIdLiteral = MAPA_ANTIGUO[cleanStr];
            
            if (nuevoIdLiteral && permisosMap[nuevoIdLiteral]) {
              await cliente.query(
                'INSERT INTO rol_permisos (rol_id, permiso_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [rol.id, permisosMap[nuevoIdLiteral]]
              );
              mapeadosCount++;
            }
          }
          console.log(`   - Rol "${rol.nombre}" (id:${rol.id}): Rescatados ${mapeadosCount} módulos.`);
        }
      }

      console.log('4. Eliminando columna "permisos" en la tabla roles...');
      await cliente.query('ALTER TABLE roles DROP COLUMN permisos;');

    } else {
      console.log('   (Omitiendo migración M:N ya que la columna "permisos" original de la tabla "roles" ya no existe)');
    }

    await cliente.query('COMMIT');
    console.log('✅ Migración de Base de Datos completada exitosamente.');

  } catch (error) {
    await cliente.query('ROLLBACK');
    console.error('❌ Error fatal en la migración:', error);
  } finally {
    cliente.release();
    pool.end();
  }
};

migrarBaseDeDatos();
