const pool = require('./src/config/db');

const actualizarTablas = async () => {
  try {
    console.log('Agregando columna de permisos a la tabla roles...');
    
    // 1. Agregamos la columna como un arreglo de texto
    await pool.query(`ALTER TABLE roles ADD COLUMN IF NOT EXISTS permisos TEXT[] DEFAULT '{}'`);
    
    // 2. Le damos TODOS los permisos al Administrador por defecto para no quedarnos por fuera
    const todosLosPermisos = ['Dashboard', 'Roles y permisos', 'Usuarios', 'Categorías', 'Productos', 'Proveedores', 'Compras', 'Clientes', 'Ventas', 'Pedidos', 'Entregas', 'Estadísticas'];
    await pool.query(`UPDATE roles SET permisos = $1 WHERE nombre = 'Administrador'`, [todosLosPermisos]);

    console.log('✅ Base de datos actualizada con éxito');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error actualizando la base de datos:', error);
    process.exit(1);
  }
};

actualizarTablas();