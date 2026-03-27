import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import './UserModal.css';

export const UserModal = ({ isOpen, onClose, mode, userData, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    password: ''
  });
  
  // NUEVO: Estado de errores manejado como objeto para múltiples inputs
  const [errors, setErrors] = useState({}); 

  useEffect(() => {
    if (isOpen && userData && (mode === 'edit' || mode === 'view')) {
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        role: userData.role || '',
        password: '' // En edición, la contraseña suele estar vacía a menos que quiera cambiarla
      });
      setErrors({});
    } else if (isOpen && mode === 'create') {
      setFormData({ name: '', email: '', role: '', password: '' });
      setErrors({});
    }
  }, [isOpen, mode, userData]);

  if (!isOpen) return null;

  const isViewOnly = mode === 'view';
  const title = mode === 'create' ? 'Registrar Usuario' : mode === 'edit' ? 'Editar Usuario' : 'Detalle del Usuario';
  const buttonText = mode === 'create' ? 'Crear Usuario' : 'Guardar Cambios';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Si hay error en este campo y el usuario empieza a escribir, limpiamos el error
    if (errors[name]) {
      setErrors({ ...errors, [name]: false });
    }
  };

  const handleSubmit = () => {
    // --- VALIDACIÓN VISUAL MULTIPLE ---
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = true;
    if (!formData.email.trim()) newErrors.email = true;
    if (!formData.role.trim()) newErrors.role = true;
    // La contraseña es obligatoria solo si estamos creando un nuevo usuario
    if (mode === 'create' && !formData.password.trim()) newErrors.password = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const dataToSave = {
      id: userData ? userData.id : null,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      password: formData.password,
      isActive: userData ? userData.isActive : true
    };

    onSave(dataToSave);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="btn-close" onClick={onClose} title="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            
            <div className="input-group">
              <label>
                Nombre Completo {!isViewOnly && <span className="required-asterisk">*</span>}
              </label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={isViewOnly}
                placeholder="Ej: Juan Pérez"
                className={errors.name ? 'input-error' : ''}
              />
              {errors.name && <span className="error-text">El nombre es obligatorio.</span>}
            </div>

            <div className="input-group">
              <label>
                Correo Electrónico {!isViewOnly && <span className="required-asterisk">*</span>}
              </label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isViewOnly}
                placeholder="Ej: usuario@soul.com"
                className={errors.email ? 'input-error' : ''}
              />
              {errors.email && <span className="error-text">El correo es obligatorio.</span>}
            </div>

            <div className="input-group">
              <label>
                Rol del Sistema {!isViewOnly && <span className="required-asterisk">*</span>}
              </label>
              <select 
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={isViewOnly}
                className={errors.role ? 'input-error' : ''}
              >
                <option value="">Seleccione un rol...</option>
                <option value="Administrador">Administrador</option>
                <option value="Vendedor">Vendedor</option>
                <option value="Domiciliario">Domiciliario</option>
              </select>
              {errors.role && <span className="error-text">Debe seleccionar un rol.</span>}
            </div>

            {(!isViewOnly && (mode === 'create' || mode === 'edit')) && (
              <div className="input-group">
                <label>
                  Contraseña 
                  {mode === 'create' && !isViewOnly && <span className="required-asterisk">*</span>}
                  {mode === 'edit' && <span style={{ fontSize: '11px', marginLeft: '5px', color: '#71717a' }}>(Opcional)</span>}
                </label>
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={mode === 'edit' ? "Dejar en blanco para no cambiar" : "Mínimo 8 caracteres"}
                  className={errors.password ? 'input-error' : ''}
                />
                {errors.password && <span className="error-text">La contraseña es obligatoria al crear.</span>}
              </div>
            )}

          </div>
        </div>

        {!isViewOnly && (
          <div className="modal-footer">
            <button className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button className="btn-primary-modal" onClick={handleSubmit}>
              {buttonText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};