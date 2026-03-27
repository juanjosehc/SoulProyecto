import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import './SupplierModal.css';

export const SupplierModal = ({ isOpen, onClose, mode, supplierData, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Jurídico', // Valor por defecto
    document: '',
    contactName: '',
    email: '',
    phone: '',
    city: '',
    address: '',
    description: ''
  });

  // NUEVO: Estado para manejar múltiples errores visuales
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && supplierData && (mode === 'edit' || mode === 'view')) {
      setFormData({
        name: supplierData.name || '',
        type: supplierData.type || 'Jurídico',
        document: supplierData.document || '',
        contactName: supplierData.contactName || '',
        email: supplierData.email || '',
        phone: supplierData.phone || '',
        city: supplierData.city || '',
        address: supplierData.address || '',
        description: supplierData.description || ''
      });
      setErrors({});
    } else if (isOpen && mode === 'create') {
      setFormData({
        name: '', type: 'Jurídico', document: '', contactName: '', email: '', phone: '', city: '', address: '', description: ''
      });
      setErrors({});
    }
  }, [isOpen, mode, supplierData]);

  if (!isOpen) return null;

  const isViewOnly = mode === 'view';
  const title = mode === 'create' ? 'Registrar Proveedor' : mode === 'edit' ? 'Editar Proveedor' : 'Detalle del Proveedor';
  const buttonText = mode === 'create' ? 'Crear Proveedor' : 'Guardar Cambios';

  const documentLabel = formData.type === 'Jurídico' ? 'NIT' : 'Documento';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiamos el error de este campo al escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleSubmit = () => {
    const newErrors = {};

    // Validación visual (Reemplaza al alert)
    if (!formData.name.trim()) newErrors.name = true;
    if (!formData.document.trim()) newErrors.document = true;
    if (!formData.contactName.trim()) newErrors.contactName = true;
    if (!formData.phone.trim()) newErrors.phone = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      id: supplierData ? supplierData.id : null,
      ...formData,
      isActive: supplierData ? supplierData.isActive : true
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container modal-large">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="btn-close" onClick={onClose} title="Cerrar"><X size={20} /></button>
        </div>

        <div className="modal-body">
          
          <div className="input-group">
            <label>Nombre del Proveedor {!isViewOnly && <span className="required-asterisk">*</span>}</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              disabled={isViewOnly} 
              placeholder="Ej: Nike Colombia"
              className={errors.name ? 'input-error' : ''} 
            />
            {errors.name && <span className="error-text">El nombre es obligatorio.</span>}
          </div>

          <div className="form-grid-2">
            <div className="input-group">
              <label>Tipo de Proveedor {!isViewOnly && <span className="required-asterisk">*</span>}</label>
              <select 
                name="type" 
                value={formData.type} 
                onChange={handleChange} 
                disabled={isViewOnly} 
                className="custom-select"
              >
                <option value="Jurídico">Jurídico</option>
                <option value="Natural">Natural</option>
              </select>
            </div>
            <div className="input-group">
              <label>{documentLabel} {!isViewOnly && <span className="required-asterisk">*</span>}</label>
              <input 
                type="text" 
                name="document" 
                value={formData.document} 
                onChange={handleChange} 
                disabled={isViewOnly} 
                placeholder={`Ej: ${formData.type === 'Jurídico' ? '900123456-1' : '1020304050'}`}
                className={errors.document ? 'input-error' : ''} 
              />
              {errors.document && <span className="error-text">El {documentLabel.toLowerCase()} es obligatorio.</span>}
            </div>
          </div>

          <div className="form-grid-2">
            <div className="input-group">
              <label>Persona de Contacto {!isViewOnly && <span className="required-asterisk">*</span>}</label>
              <input 
                type="text" 
                name="contactName" 
                value={formData.contactName} 
                onChange={handleChange} 
                disabled={isViewOnly} 
                placeholder="Ej: Jorge Ramírez" 
                className={errors.contactName ? 'input-error' : ''}
              />
              {errors.contactName && <span className="error-text">El contacto es obligatorio.</span>}
            </div>
            <div className="input-group">
              <label>Teléfono {!isViewOnly && <span className="required-asterisk">*</span>}</label>
              <input 
                type="text" 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange} 
                disabled={isViewOnly} 
                placeholder="Ej: 6015551234" 
                className={errors.phone ? 'input-error' : ''}
              />
              {errors.phone && <span className="error-text">El teléfono es obligatorio.</span>}
            </div>
          </div>

          <div className="form-grid-2">
            <div className="input-group">
              <label>Correo Electrónico <span style={{ fontSize: '11px', marginLeft: '5px', color: '#71717a' }}>(Opcional)</span></label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} disabled={isViewOnly} placeholder="ejemplo@proveedor.com" />
            </div>
            <div className="input-group">
              <label>Ciudad <span style={{ fontSize: '11px', marginLeft: '5px', color: '#71717a' }}>(Opcional)</span></label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} disabled={isViewOnly} placeholder="Ej: Medellín" />
            </div>
          </div>

          <div className="input-group">
            <label>Dirección <span style={{ fontSize: '11px', marginLeft: '5px', color: '#71717a' }}>(Opcional)</span></label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} disabled={isViewOnly} placeholder="Ej: Cra 43A # 1-50" />
          </div>

          <div className="input-group">
            <label>Descripción <span style={{ fontSize: '11px', marginLeft: '5px', color: '#71717a' }}>(Opcional)</span></label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              disabled={isViewOnly} 
              placeholder="Detalles sobre los productos o servicios que provee..." 
              rows="3" 
              className="textarea-field"
            />
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