import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import './Login.css';

const API = 'http://localhost:3000/api';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estados para registro
  const [showRegister, setShowRegister] = useState(false);
  const [regData, setRegData] = useState({ nombres: '', apellidos: '', correo: '', telefono: '', password: '', confirmPassword: '' });
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // Estados para recuperar contraseña
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotError, setForgotError] = useState('');

  const navigate = useNavigate();

  // === LOGIN ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setError('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión');
        setLoading(false);
        return;
      }

      // Guardar token y datos del usuario
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirigir según tipo de usuario
      if (data.user.tipo === 'cliente') {
        navigate('/catalogo');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError('No se pudo conectar con el servidor');
      setLoading(false);
    }
  };

  // === REGISTRO ===
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!regData.nombres.trim() || !regData.correo.trim() || !regData.password) {
      setRegError('Nombre, correo y contraseña son obligatorios');
      return;
    }

    if (regData.password !== regData.confirmPassword) {
      setRegError('Las contraseñas no coinciden');
      return;
    }

    if (regData.password.length < 6) {
      setRegError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData)
      });

      const data = await res.json();

      if (!res.ok) {
        setRegError(data.error || 'Error al registrarse');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setLoading(false);
      navigate('/catalogo');
    } catch (err) {
      setRegError('No se pudo conectar con el servidor');
      setLoading(false);
    }
  };

  // === RECUPERAR CONTRASEÑA ===
  const handleForgot = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMsg('');

    if (!forgotEmail.trim()) {
      setForgotError('Ingresa tu correo electrónico');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });

      const data = await res.json();

      if (!res.ok) {
        setForgotError(data.error || 'Error al enviar solicitud');
      } else {
        setForgotMsg(data.message);
      }
    } catch (err) {
      setForgotError('No se pudo conectar con el servidor');
    }
    setLoading(false);
  };

  // === VISTA REGISTRO ===
  if (showRegister) {
    return (
      <div className="login-page">
        <div className="login-brand-panel">
          <div className="brand-content">
            <h1 className="brand-logo">SOUL</h1>
            <p className="brand-tagline">Calidad y estilo en cada paso</p>
          </div>
        </div>
        <div className="login-form-panel">
          <div className="login-form-wrapper">
            <button className="btn-back-auth" onClick={() => { setShowRegister(false); setRegError(''); setRegSuccess(''); }}>
              <ArrowLeft size={16} /> Volver al Login
            </button>
            <h2 className="login-title">Crear Cuenta</h2>
            <p className="login-subtitle">Regístrate para realizar pedidos</p>

            {regError && <div className="login-error">{regError}</div>}
            {regSuccess && <div className="login-success">{regSuccess}</div>}

            <form onSubmit={handleRegister} className="login-form">
              <div className="input-group">
                <label>Nombres *</label>
                <input type="text" value={regData.nombres} onChange={(e) => setRegData({...regData, nombres: e.target.value})} placeholder="Tu nombre" />
              </div>
              <div className="input-group">
                <label>Apellidos</label>
                <input type="text" value={regData.apellidos} onChange={(e) => setRegData({...regData, apellidos: e.target.value})} placeholder="Tus apellidos" />
              </div>
              <div className="input-group">
                <label>Correo Electrónico *</label>
                <input type="email" value={regData.correo} onChange={(e) => setRegData({...regData, correo: e.target.value})} placeholder="ejemplo@soul.com" />
              </div>
              <div className="input-group">
                <label>Teléfono</label>
                <input type="text" value={regData.telefono} onChange={(e) => setRegData({...regData, telefono: e.target.value})} placeholder="300 123 4567" />
              </div>
              <div className="input-group">
                <label>Contraseña *</label>
                <input type="password" value={regData.password} onChange={(e) => setRegData({...regData, password: e.target.value})} placeholder="Mínimo 6 caracteres" />
              </div>
              <div className="input-group">
                <label>Confirmar Contraseña *</label>
                <input type="password" value={regData.confirmPassword} onChange={(e) => setRegData({...regData, confirmPassword: e.target.value})} placeholder="Confirma tu contraseña" />
              </div>
              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? 'Registrando...' : 'Crear Cuenta'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // === VISTA RECUPERAR CONTRASEÑA ===
  if (showForgot) {
    return (
      <div className="login-page">
        <div className="login-brand-panel">
          <div className="brand-content">
            <h1 className="brand-logo">SOUL</h1>
            <p className="brand-tagline">Calidad y estilo en cada paso</p>
          </div>
        </div>
        <div className="login-form-panel">
          <div className="login-form-wrapper">
            <button className="btn-back-auth" onClick={() => { setShowForgot(false); setForgotError(''); setForgotMsg(''); }}>
              <ArrowLeft size={16} /> Volver al Login
            </button>
            <h2 className="login-title">Recuperar Contraseña</h2>
            <p className="login-subtitle">Ingresa tu correo para recibir un enlace de recuperación</p>

            {forgotError && <div className="login-error">{forgotError}</div>}
            {forgotMsg && <div className="login-success">{forgotMsg}</div>}

            <form onSubmit={handleForgot} className="login-form">
              <div className="input-group">
                <label>Correo Electrónico</label>
                <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="ejemplo@soul.com" />
              </div>
              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar Enlace'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // === VISTA LOGIN (PRINCIPAL) ===
  return (
    <div className="login-page">
      
      <div className="login-brand-panel">
        <div className="brand-content">
          <h1 className="brand-logo">SOUL</h1>
          <p className="brand-tagline">Calidad y estilo en cada paso</p>
        </div>
      </div>

      <div className="login-form-panel">
        <div className="login-form-wrapper">
          <h2 className="login-title">Inicia Sesión</h2>
          <p className="login-subtitle">Ingresa tus credenciales para acceder</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            
            <div className="input-group">
              <label htmlFor="email">Correo Electrónico</label>
              <input 
                type="email" 
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if(error) setError('');
                }}
                placeholder="ejemplo@soul.com"
                className={error && !email ? 'input-error' : ''}
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Contraseña</label>
              <input 
                type="password" 
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if(error) setError('');
                }}
                placeholder="••••••••"
                className={error && !password ? 'input-error' : ''}
              />
            </div>

            <div className="forgot-password-container">
              <a href="#" className="forgot-password-link" onClick={(e) => { e.preventDefault(); setShowForgot(true); }}>
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar al Panel'}
            </button>
            
            <div className="divider">o</div>

            <button 
              type="button" 
              className="btn-catalog-link" 
              onClick={() => navigate('/catalogo')}
            >
              <ShoppingBag size={18} />
              Ver Catálogo de Productos
            </button>
          </form>

          <div className="register-prompt">
            <p>¿No tienes una cuenta? <a href="#" className="register-link" onClick={(e) => { e.preventDefault(); setShowRegister(true); }}>Regístrate aquí</a></p>
          </div>
        </div>
      </div>

    </div>
  );
};