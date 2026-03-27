import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import './ClientModal.css';

export const ClientModal = ({ isOpen, onClose, mode, clientData, onSave }) => {
  const [formData, setFormData] = useState({
    nombres: '', apellidos: '', correo: '', telefono: '', direccion: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && clientData && (mode === 'edit' || mode === 'view')) {
      setFormData({
        nombres: clientData.nombres || '',
        apellidos: clientData.apellidos || '',
        correo: clientData.correo || '',
        telefono: clientData.telefono || '',
        direccion: clientData.direccion || ''
      });
      setErrors({});
    } else if (isOpen && mode === 'create') {
      setFormData({ nombres: '', apellidos: '', correo: '', telefono: '', direccion: '' });
      setErrors({});
    }
  }, [isOpen, mode, clientData]);

  if (!isOpen) return null;

  const isViewOnly = mode === 'view';
  const title = mode === 'create' ? 'Registrar Cliente' : mode === 'edit' ? 'Editar Cliente' : 'Detalle del Cliente';
  const buttonText = mode === 'create' ? 'Crear Cliente' : 'Guardar Cambios';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleSubmit = () => {
    const newErrors = {};
    if (!formData.nombres.trim()) newErrors.nombres = true;
    if (!formData.telefono.trim()) newErrors.telefono = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      id: clientData ? clientData.id : null,
      nombres: formData.nombres,
      apellidos: formData.apellidos,
      correo: formData.correo,
      telefono: formData.telefono,
      direccion: formData.direccion
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="btn-close" onClick={onClose} title="Cerrar"><X size={20} /></button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            <div className="form-row">
              <div className="input-group" style={{ flex: 1 }}>
                <label>Nombres {!isViewOnly && <span className="required-asterisk">*</span>}</label>
                <input 
                  type="text" name="nombres" value={formData.nombres} onChange={handleChange}
                  disabled={isViewOnly} placeholder="Ej: Juan" className={errors.nombres ? 'input-error' : ''}
                />
                {errors.nombres && <span className="error-text">El nombre es obligatorio.</span>}
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Apellidos</label>
                <input 
                  type="text" name="apellidos" value={formData.apellidos} onChange={handleChange}
                  disabled={isViewOnly} placeholder="Ej: Pérez"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="input-group" style={{ flex: 1 }}>
                <label>Correo Electrónico</label>
                <input 
                  type="email" name="correo" value={formData.correo} onChange={handleChange}
                  disabled={isViewOnly} placeholder="Ej: juan@email.com"
                />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Teléfono {!isViewOnly && <span className="required-asterisk">*</span>}</label>
                <input 
                  type="text" name="telefono" value={formData.telefono} onChange={handleChange}
                  disabled={isViewOnly} placeholder="Ej: 3001234567" className={errors.telefono ? 'input-error' : ''}
                />
                {errors.telefono && <span className="error-text">El teléfono es obligatorio.</span>}
              </div>
            </div>

            <div className="input-group">
              <label>Dirección</label>
              {isViewOnly ? (
                <input type="text" name="direccion" value={formData.direccion} disabled={true} />
              ) : (
                <textarea 
                  name="direccion" value={formData.direccion} onChange={handleChange}
                  placeholder="Ej: Calle 123 #45-67, Bogotá" rows="3" className="textarea-field" 
                />
              )}
            </div>
          </div>
        </div>

        {!isViewOnly && (
          <div className="modal-footer">
            <button className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button className="btn-primary-modal" onClick={handleSubmit}>{buttonText}</button>
          </div>
        )}
      </div>
    </div>
  );
};