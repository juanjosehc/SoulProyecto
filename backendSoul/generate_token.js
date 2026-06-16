const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const pool = new Pool({
  connectionString: 'postgresql://soulbd_user:s55CkrQfPe7QBB92rzBoXXlWowhs7vOU@dpg-d70vru14tr6s739o5lc0-a.oregon-postgres.render.com/soulbd',
  ssl: {
    rejectUnauthorized: false
  }
});

const run = async () => {
  try {
    console.log('Conectando a la base de datos...');
    const result = await pool.query(`
      SELECT u.id, u.nombre, u.email, r.nombre as rol,
      COALESCE((
        SELECT json_agg(p.nombre)
        FROM rol_permisos rp
        JOIN permisos p ON rp.permiso_id = p.id
        WHERE rp.rol_id = r.id
      ), '[]'::json) as permisos
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE u.is_active = true
    `);

    if (result.rows.length === 0) {
      console.log('No se encontraron usuarios en la base de datos.');
      process.exit(0);
    }

    console.log('\nUsuarios encontrados:');
    result.rows.forEach(row => {
      console.log(`- ID: ${row.id} | Nombre: ${row.nombre} | Email: ${row.email} | Rol: ${row.rol} | Permisos: ${JSON.stringify(row.permisos)}`);
    });

    // Buscar administrador o usuario con permisos de entregas
    const adminUser = result.rows.find(row => {
      const perms = Array.isArray(row.permisos) ? row.permisos : [];
      return perms.map(p => p.toUpperCase()).includes('MODULO_ENTREGAS') || 
             perms.map(p => p.toUpperCase()).includes('ENTREGAS');
    }) || result.rows[0];

    console.log(`\nGenerando token para el usuario: ${adminUser.nombre} (${adminUser.email})`);
    
    const payload = {
      id: adminUser.id,
      nombre: adminUser.nombre,
      email: adminUser.email,
      rol: adminUser.rol,
      permisos: adminUser.permisos || [],
      tipo: 'usuario'
    };

    const token = jwt.sign(payload, 'soul_secret_key_2026', { expiresIn: '30d' });
    console.log('\n================================================================');
    console.log('TOKEN DE SESIÓN DE PRUEBA (VÁLIDO POR 30 DÍAS):');
    console.log('================================================================');
    console.log(token);
    console.log('================================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

run();
