import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import './DeliveryModal.css';

const domiciliariosDisponibles = ['María Domiciliaria', 'Carlos Repartidor', 'Pedro Logística', 'Empresa Externa'];
const estadosEntrega = ['Pendiente', 'En camino', 'Entregado', 'Fallido'];

export const DeliveryModal = ({ isOpen, onClose, mode, deliveryData, onSave }) => {
  const [formData, setFormData] = useState({
    orderCode: '',
    clientName: '',
    address: '',
    deliveryPerson: '',
    date: '',
    status: 'Pendiente',
    notes: ''
  });

  // NUEVO: Estado para manejar validaciones visuales
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && deliveryData && (mode === 'edit' || mode === 'view')) {
      setFormData({
        orderCode: deliveryData.orderCode || '',
        clientName: deliveryData.clientName || '',
        address: deliveryData.address || '',
        deliveryPerson: deliveryData.deliveryPerson || '',
        date: deliveryData.date || '',
        status: deliveryData.status || 'Pendiente',
        notes: deliveryData.notes || ''
      });
      setErrors({});
    } else if (isOpen && mode === 'create') {
      const today = new Date().toISOString().split('T')[0];
      setFormData({ 
        orderCode: '', clientName: '', address: '', deliveryPerson: '', date: today, status: 'Pendiente', notes: '' 
      });
      setErrors({});
    }
  }, [isOpen, mode, deliveryData]);

  if (!isOpen) return null;

  const isViewOnly = mode === 'view';
  const title = mode === 'create' ? 'Programar Entrega' : mode === 'edit' ? 'Editar Entrega' : 'Detalle de la Entrega';
  const buttonText = mode === 'create' ? 'Programar' : 'Guardar Cambios';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiamos error al escribir
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: false }));
  };

  const handleSubmit = () => {
    const newErrors = {};

    // Validaciones visuales (Sin alerts)
    if (!formData.orderCode.trim()) newErrors.orderCode = true;
    if (!formData.clientName.trim()) newErrors.clientName = true;
    if (!formData.address.trim()) newErrors.address = true;
    if (!formData.deliveryPerson.trim()) newErrors.deliveryPerson = true;
    if (!formData.date.trim()) newErrors.date = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      id: deliveryData ? deliveryData.id : null,
      ...formData
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container modal-medium-delivery">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            
            <div className="form-row">
              <div className="input-group half-width">
                <label>Pedido Asociado {!isViewOnly && <span className="required-asterisk">*</span>}</label>
                <input 
                  type="text" 
                  name="orderCode" 
                  value={formData.orderCode} 
                  onChange={handleChange} 
                  disabled={isViewOnly} 
                  placeholder="Ej: ORD001"
                  className={errors.orderCode ? 'input-error' : ''}
                />
                {errors.orderCode && <span className="error-text">Obligatorio.</span>}
              </div>

              <div className="input-group half-width">
                <label>Fecha Estimada {!isViewOnly && <span className="required-asterisk">*</span>}</label>
                <input 
                  type="date" 
                  name="date" 
                  value={formData.date} 
                  onChange={handleChange} 
                  disabled={isViewOnly}
                  className={errors.date ? 'input-error' : ''}
                />
                {errors.date && <span className="error-text">Obligatorio.</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="input-group half-width">
                <label>Nombre del Cliente {!isViewOnly && <span className="required-asterisk">*</span>}</label>
                <input 
                  type="text" 
                  name="clientName" 
                  value={formData.clientName} 
                  onChange={handleChange} 
                  disabled={isViewOnly} 
                  placeholder="Ej: Juan Pérez"
                  className={errors.clientName ? 'input-error' : ''}
                />
                {errors.clientName && <span className="error-text">Obligatorio.</span>}
              </div>

              <div className="input-group half-width">
                <label>Dirección de Entrega {!isViewOnly && <span className="required-asterisk">*</span>}</label>
                <input 
                  type="text" 
                  name="address" 
                  value={formData.address} 
                  onChange={handleChange} 
                  disabled={isViewOnly} 
                  placeholder="Ej: Calle 123 #45-67"
                  className={errors.address ? 'input-error' : ''}
                />
                {errors.address && <span className="error-text">Obligatorio.</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="input-group half-width">
                <label>Domiciliario Asignado {!isViewOnly && <span className="required-asterisk">*</span>}</label>
                <select 
                  name="deliveryPerson" 
                  value={formData.deliveryPerson} 
                  onChange={handleChange} 
                  disabled={isViewOnly}
                  className={errors.deliveryPerson ? 'input-error custom-select' : 'custom-select'}
                >
                  <option value="">Seleccione...</option>
                  {domiciliariosDisponibles.map(dom => <option key={dom} value={dom}>{dom}</option>)}
                </select>
                {errors.deliveryPerson && <span className="error-text">Obligatorio.</span>}
              </div>

              <div className="input-group half-width">
                <label>Estado de la Entrega</label>
                <select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleChange} 
                  disabled={isViewOnly}
                  className="custom-select"
                >
                  {estadosEntrega.map(est => <option key={est} value={est}>{est}</option>)}
                </select>
              </div>
            </div>

            <div className="input-group full-width">
              <label>Notas / Instrucciones <span style={{ fontSize: '11px', marginLeft: '5px', color: '#71717a' }}>(Opcional)</span></label>
              <textarea 
                name="notes" 
                value={formData.notes} 
                onChange={handleChange} 
                disabled={isViewOnly} 
                placeholder="Ej: Dejar en portería, cuidado frágil..." 
                rows="3" 
                className="textarea-field"
              />
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