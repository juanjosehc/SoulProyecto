import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './Login.css'; // Reutilizamos estilos del Login

const API = 'http://localhost:3000/api';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token no válido o no proporcionado.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Falta el token de recuperación.');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Ambos campos son obligatorios.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al restablecer contraseña');
      } else {
        setSuccess('¡Contraseña actualizada con éxito! Redirigiendo...');
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (err) {
      setError('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

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
          <button className="btn-back-auth" onClick={() => navigate('/login')}>
            <ArrowLeft size={16} /> Volver al Login
          </button>
          
          <h2 className="login-title">Nueva Contraseña</h2>
          <p className="login-subtitle">Ingresa tu nueva contraseña para acceder</p>

          {error && <div className="login-error">{error}</div>}
          {success && <div className="login-success">{success}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label>Nueva Contraseña *</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Mínimo 6 caracteres" 
                disabled={Boolean(success)}
              />
            </div>
            
            <div className="input-group">
              <label>Confirmar Contraseña *</label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="Repite la contraseña" 
                disabled={Boolean(success)}
              />
            </div>

            <button type="submit" className="btn-login" disabled={loading || !token || Boolean(success)}>
              {loading ? 'Procesando...' : 'Cambiar Contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
