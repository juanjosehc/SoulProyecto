const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'soul_secret_key_2026';

/**
 * Middleware: Verificar que el request tenga un token JWT válido.
 * Agrega req.user con los datos decodificados del token.
 */
const verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};

/**
 * Middleware: Verificar que el usuario tenga un permiso específico.
 * Debe usarse DESPUÉS de verificarToken.
 * @param {string} permiso - El nombre del permiso requerido (ej: 'productos', 'ventas')
 */
const verificarPermiso = (permiso) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado.' });
    }

    const permisos = req.user.permisos || [];

    // Si no tiene permisos configurados (array vacío), permitir acceso (backwards compatibility)
    if (permisos.length === 0) {
      return next();
    }

    // Comparar case-insensitive
    const permisosNormalizados = permisos.map(p => p.toLowerCase());
    if (permisosNormalizados.includes(permiso.toLowerCase())) {
      return next();
    }

    return res.status(403).json({ error: `No tienes permiso para acceder a este módulo (${permiso}).` });
  };
};

module.exports = { verificarToken, verificarPermiso };
