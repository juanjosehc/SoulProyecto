const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 'soul_secret_key_2026';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ============================================
// 1. LOGIN (Usuarios del sistema y Clientes)
// ============================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
    }

    // Primero buscar en usuarios del sistema
    const userResult = await pool.query(`
      SELECT u.id, u.nombre, u.email, u.password_hash, u.is_active, r.nombre as rol, r.is_active as rol_activo,
      COALESCE((
        SELECT json_agg(p.nombre)
        FROM rol_permisos rp
        JOIN permisos p ON rp.permiso_id = p.id
        WHERE rp.rol_id = r.id
      ), '[]'::json) as permisos
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE u.email = $1
    `, [email]);

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];

      // Verificar que el usuario esté activo
      if (!user.is_active) {
        return res.status(403).json({ error: 'Tu cuenta está desactivada. Contacta al administrador.' });
      }

      // Verificar que el rol esté activo
      if (!user.rol_activo) {
        return res.status(403).json({ error: 'Tu rol ha sido desactivado. No puedes acceder al sistema.' });
      }

      // Verificar contraseña
      const passwordValid = await bcrypt.compare(password, user.password_hash);
      if (!passwordValid) {
        return res.status(401).json({ error: 'Contraseña incorrecta' });
      }

      // Generar token JWT
      const token = jwt.sign(
        { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, tipo: 'usuario', permisos: user.permisos || [] },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      return res.json({
        token,
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol,
          tipo: 'usuario',
          permisos: user.permisos || []
        }
      });
    }

    // Si no se encontró en usuarios del sistema, buscar en clientes
    const clientResult = await pool.query(`
      SELECT id, nombres, apellidos, correo, password_hash, is_active
      FROM clientes WHERE correo = $1
    `, [email]);

    if (clientResult.rows.length > 0) {
      const client = clientResult.rows[0];

      if (!client.is_active) {
        return res.status(403).json({ error: 'Tu cuenta está desactivada. Contacta al administrador.' });
      }

      if (!client.password_hash) {
        return res.status(401).json({ error: 'Esta cuenta no tiene contraseña configurada. Usa la opción de recuperar contraseña.' });
      }

      const passwordValid = await bcrypt.compare(password, client.password_hash);
      if (!passwordValid) {
        return res.status(401).json({ error: 'Contraseña incorrecta' });
      }

      const token = jwt.sign(
        { id: client.id, nombre: `${client.nombres} ${client.apellidos}`, email: client.correo, tipo: 'cliente' },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      return res.json({
        token,
        user: {
          id: client.id,
          nombre: `${client.nombres} ${client.apellidos}`,
          email: client.correo,
          tipo: 'cliente'
        }
      });
    }

    // No se encontró en ninguna tabla
    return res.status(404).json({ error: 'No se encontró una cuenta con este correo electrónico' });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// 2. REGISTRO DE CLIENTE (desde el catálogo)
// ============================================
const registrarCliente = async (req, res) => {
  try {
    const { nombres, apellidos, correo, telefono, direccion, password } = req.body;

    if (!nombres || !correo || !password) {
      return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios' });
    }

    // Verificar si ya existe
    const existe = await pool.query('SELECT id FROM clientes WHERE correo = $1', [correo]);
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'Ya existe una cuenta con este correo electrónico' });
    }

    // También verificar en usuarios del sistema
    const existeUsuario = await pool.query('SELECT id FROM usuarios WHERE email = $1', [correo]);
    if (existeUsuario.rows.length > 0) {
      return res.status(400).json({ error: 'Este correo ya está registrado en el sistema' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO clientes (nombres, apellidos, correo, telefono, direccion, password_hash) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nombres, apellidos, correo',
      [nombres, apellidos || '', correo, telefono || '', direccion || '', passwordHash]
    );

    const newClient = result.rows[0];
    const token = jwt.sign(
      { id: newClient.id, nombre: `${newClient.nombres} ${newClient.apellidos}`, email: newClient.correo, tipo: 'cliente' },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(201).json({
      message: 'Cuenta creada exitosamente',
      token,
      user: {
        id: newClient.id,
        nombre: `${newClient.nombres} ${newClient.apellidos}`,
        email: newClient.correo,
        tipo: 'cliente'
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// 3. RECUPERAR CONTRASEÑA (enviar email)
// ============================================
const solicitarRecuperacion = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'El correo es obligatorio' });

    // Buscar en usuarios
    let userFound = null;
    let tipo = null;

    const userResult = await pool.query('SELECT id, nombre, email FROM usuarios WHERE email = $1', [email]);
    if (userResult.rows.length > 0) {
      userFound = userResult.rows[0];
      tipo = 'usuario';
    } else {
      const clientResult = await pool.query('SELECT id, nombres, correo FROM clientes WHERE correo = $1', [email]);
      if (clientResult.rows.length > 0) {
        userFound = { id: clientResult.rows[0].id, nombre: clientResult.rows[0].nombres, email: clientResult.rows[0].correo };
        tipo = 'cliente';
      }
    }

    if (!userFound) {
      return res.status(404).json({ error: 'No se encontró una cuenta con este correo electrónico' });
    }

    // Generar token de recuperación (válido 1 hora)
    const resetToken = jwt.sign(
      { id: userFound.id, email: userFound.email, tipo },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Intentar enviar email
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'soul.sneakers.store@gmail.com',
          pass: process.env.EMAIL_PASS || ''
        }
      });

      await transporter.sendMail({
        from: '"SOUL Sneakers" <soul.sneakers.store@gmail.com>',
        to: email,
        subject: 'Recuperación de contraseña - SOUL',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #C9A24D;">SOUL Sneakers</h2>
            <p>Hola ${userFound.nombre},</p>
            <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el siguiente botón:</p>
            <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #C9A24D; color: #000; text-decoration: none; border-radius: 8px; font-weight: bold;">Restablecer Contraseña</a>
            <p style="margin-top: 20px; color: #666; font-size: 12px;">Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este correo.</p>
          </div>
        `
      });

      res.json({ message: 'Se ha enviado un enlace de recuperación a tu correo electrónico' });
    } catch (emailError) {
      // Si no se puede enviar email, devolver el token directamente (para desarrollo)
      console.error('No se pudo enviar email:', emailError.message);
      res.json({ 
        message: 'Enlace de recuperación generado (email no configurado)', 
        resetToken,
        devNote: 'Configura EMAIL_USER y EMAIL_PASS en .env para enviar emails reales'
      });
    }

  } catch (error) {
    console.error('Error en recuperación:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// 4. RESTABLECER CONTRASEÑA (con token)
// ============================================
const restablecerPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token y nueva contraseña son obligatorios' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ error: 'El enlace ha expirado o es inválido. Solicita uno nuevo.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    if (decoded.tipo === 'usuario') {
      await pool.query('UPDATE usuarios SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [passwordHash, decoded.id]);
    } else {
      await pool.query('UPDATE clientes SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [passwordHash, decoded.id]);
    }

    res.json({ message: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.' });

  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { login, registrarCliente, solicitarRecuperacion, restablecerPassword };
