import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import './CategoryModal.css';

export const CategoryModal = ({ isOpen, onClose, mode, categoryData, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  
  // Estado de errores visuales
  const [errors, setErrors] = useState({}); 

  useEffect(() => {
    if (isOpen && categoryData && (mode === 'edit' || mode === 'view')) {
      setFormData({
        name: categoryData.name || '',
        description: categoryData.description || ''
      });
      setErrors({});
    } else if (isOpen && mode === 'create') {
      setFormData({ name: '', description: '' });
      setErrors({});
    }
  }, [isOpen, mode, categoryData]);

  if (!isOpen) return null;

  const isViewOnly = mode === 'view';
  const title = mode === 'create' ? 'Registrar Categoría' : mode === 'edit' ? 'Editar Categoría' : 'Detalle de la Categoría';
  const buttonText = mode === 'create' ? 'Crear Categoría' : 'Guardar Cambios';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Limpiamos el error al escribir (ahora solo aplica para el nombre)
    if (errors[name]) {
      setErrors({ ...errors, [name]: false });
    }
  };

  const handleSubmit = () => {
    const newErrors = {};
    
    // Solo validamos que el nombre sea obligatorio
    if (!formData.name.trim()) newErrors.name = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const dataToSave = {
      id: categoryData ? categoryData.id : null,
      name: formData.name,
      description: formData.description, // Se guarda aunque esté vacía
      isActive: categoryData ? categoryData.isActive : true
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
                Nombre de la Categoría {!isViewOnly && <span className="required-asterisk">*</span>}
              </label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={isViewOnly}
                placeholder="Ej: Zapatos Deportivos"
                className={errors.name ? 'input-error' : ''}
              />
              {errors.name && <span className="error-text">El nombre es obligatorio.</span>}
            </div>

            <div className="input-group">
              <label>
                Descripción <span style={{ fontSize: '11px', marginLeft: '5px', color: '#71717a' }}>(Opcional)</span>
              </label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={isViewOnly}
                placeholder="Breve descripción de los productos en esta categoría..."
                className="textarea-custom" // Quitamos la clase de error dinámica
                rows="4"
              />
            </div>

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