import { X, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatCOP } from '../../../../utils/currency';
import { AutocompleteInput } from '../../../../utils/AutocompleteInput';
import '../../../../utils/AutocompleteInput.css';
import './OrderModal.css';

const API = 'http://localhost:3000/api';

export const OrderModal = ({ isOpen, onClose, mode, orderData, onSave }) => {
  const [formData, setFormData] = useState({
    clientName: '', phone: '', deliveryDate: '', deliveryAddress: '', observations: '', orderStatus: 'Pendiente',
    clienteId: null, usuarioId: null, domiciliarioName: ''
  });

  const [cart, setCart] = useState([]);
  
  const [currentProduct, setCurrentProduct] = useState('');
  const [currentTalla, setCurrentTalla] = useState('');
  const [currentCantidad, setCurrentCantidad] = useState(1);
  const [currentValor, setCurrentValor] = useState('');
  const [tallasDisponibles, setTallasDisponibles] = useState([]); // [{talla, stock}]
  const [stockActual, setStockActual] = useState(0);
  const [stockError, setStockError] = useState('');
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && orderData && (mode === 'edit' || mode === 'view')) {
      setFormData({
        clientName: orderData.clientName || '', phone: orderData.phone || '', 
        deliveryDate: orderData.deliveryDate || '', deliveryAddress: orderData.deliveryAddress || '', 
        observations: orderData.observations || '', orderStatus: orderData.orderStatus || 'Pendiente',
        clienteId: orderData.clienteId || null, usuarioId: orderData.usuarioId || null,
        domiciliarioName: orderData.domiciliarioName || ''
      });
      setCart(orderData.items || []); setErrors({});
    } else if (isOpen && mode === 'create') {
      setFormData({ clientName: '', phone: '', deliveryDate: '', deliveryAddress: '', observations: '', orderStatus: 'Pendiente', clienteId: null, usuarioId: null, domiciliarioName: '' });
      setCart([]); setCurrentProduct(''); setCurrentCantidad(1); setCurrentValor('');
      setTallasDisponibles([]); setStockActual(0); setStockError(''); setErrors({});
    }
  }, [isOpen, mode, orderData]);

  if (!isOpen) return null;

  const isViewOnly = mode === 'view';
  const title = mode === 'create' ? 'Registrar Pedido' : mode === 'edit' ? 'Editar Pedido' : 'Detalle del Pedido';
  const buttonText = mode === 'create' ? 'Crear Pedido' : 'Guardar Cambios';

  // === PRODUCTO AUTOCOMPLETE ===
  const handleProductSelect = (item) => {
    setCurrentProduct(item.name);
    const detalle = item.sizesDetail || [];
    setTallasDisponibles(detalle);
    setCurrentTalla(detalle[0]?.talla || '');
    setStockActual(detalle[0]?.stock || 0);
    setCurrentValor(item.price || '');
    setStockError('');
  };

  const handleTallaChange = (talla) => {
    setCurrentTalla(talla);
    const found = tallasDisponibles.find(t => t.talla === talla);
    setStockActual(found?.stock || 0);
    setStockError('');
  };

  // === CLIENTE AUTOCOMPLETE ===
  const handleClienteSelect = (item) => {
    const nombreCompleto = `${item.nombres} ${item.apellidos || ''}`.trim();
    setFormData(prev => ({
      ...prev,
      clientName: nombreCompleto,
      phone: item.telefono || prev.phone,
      clienteId: item.id
    }));
    if (errors.clientName) setErrors(prev => ({ ...prev, clientName: false }));
  };

  // === DOMICILIARIO AUTOCOMPLETE ===
  const handleDomiciliarioSelect = (item) => {
    setFormData(prev => ({
      ...prev,
      domiciliarioName: item.name,
      usuarioId: item.id
    }));
  };

  const handleAddToCart = () => {
    const newErrors = {};
    if (!currentProduct) newErrors.cart = true;
    if (!currentCantidad || currentCantidad <= 0) newErrors.currentCantidad = true;
    if (!currentValor || currentValor <= 0) newErrors.currentValor = true;
    if (!currentTalla) newErrors.currentTalla = true;

    // Stock validation
    if (currentTalla && Number(currentCantidad) > stockActual) {
      setStockError(`Stock insuficiente. Disponible: ${stockActual}`);
      return;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...newErrors }));
      return;
    }

    const newItem = {
      product: currentProduct, talla: currentTalla, cantidad: Number(currentCantidad),
      valorUnitario: Number(currentValor), total: Number(currentCantidad) * Number(currentValor)
    };
    
    setCart([...cart, newItem]);
    setCurrentCantidad(1); 
    setStockError('');
    if (errors.cart) setErrors(prev => ({ ...prev, cart: false }));
  };

  const handleRemoveFromCart = (index) => setCart(cart.filter((_, i) => i !== index));
  const totalPedido = cart.reduce((acc, item) => acc + item.total, 0);

  const handleSubmit = () => {
    const newErrors = {};
    if (!formData.clientName.trim()) newErrors.clientName = true;
    if (!formData.phone.trim()) newErrors.phone = true;
    if (!formData.deliveryDate.trim()) newErrors.deliveryDate = true;
    if (!formData.deliveryAddress.trim()) newErrors.deliveryAddress = true;
    if (cart.length === 0) newErrors.cart = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...newErrors }));
      return;
    }

    onSave({
      id: orderData ? orderData.id : null,
      ...formData, items: cart, total: totalPedido, itemsCount: cart.length
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: false }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container modal-large-order">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body split-grid-body">
          {/* PANEL IZQUIERDO */}
          <div className="panel-estetico">
            <h3 className="panel-title">Datos del Cliente y Entrega</h3>
            <div className="form-group-stack">
              <div className="input-group">
                <label>Cliente <span className="required-asterisk">*</span></label>
                {isViewOnly ? (
                  <input type="text" value={formData.clientName} disabled placeholder="Nombre completo" />
                ) : (
                  <AutocompleteInput
                    value={formData.clientName}
                    onChange={(val) => {
                      setFormData(prev => ({ ...prev, clientName: val, clienteId: null }));
                      if (errors.clientName) setErrors(prev => ({ ...prev, clientName: false }));
                    }}
                    fetchUrl={`${API}/clientes/search`}
                    placeholder="Buscar cliente..."
                    displayKey="nombres"
                    onSelect={handleClienteSelect}
                    className={errors.clientName ? 'input-error' : ''}
                  />
                )}
                {errors.clientName && <span className="error-text">El cliente es obligatorio.</span>}
              </div>
              <div className="input-group">
                <label>Teléfono <span className="required-asterisk">*</span></label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} disabled={isViewOnly} placeholder="Ej: 3001234567" className={errors.phone ? 'input-error' : ''} />
                {errors.phone && <span className="error-text">El teléfono es obligatorio.</span>}
              </div>
            </div>
            <div className="form-group-stack">
              <div className="input-group">
                <label>Fecha de Entrega <span className="required-asterisk">*</span></label>
                <input type="date" name="deliveryDate" value={formData.deliveryDate} onChange={handleChange} disabled={isViewOnly} className={`date-input ${errors.deliveryDate ? 'input-error' : ''}`} />
                {errors.deliveryDate && <span className="error-text">La fecha es obligatoria.</span>}
              </div>
              <div className="input-group">
                <label>Dirección <span className="required-asterisk">*</span></label>
                <input type="text" name="deliveryAddress" value={formData.deliveryAddress} onChange={handleChange} disabled={isViewOnly} placeholder="Ej: Calle 123 #45-67" className={`date-input ${errors.deliveryAddress ? 'input-error' : ''}`} />
                {errors.deliveryAddress && <span className="error-text">La dirección es obligatoria.</span>}
              </div>
            </div>
            <div className="input-group" style={{marginTop: '12px'}}>
              <label>Domiciliario</label>
              {isViewOnly ? (
                <input type="text" value={formData.domiciliarioName || 'Sin asignar'} disabled />
              ) : (
                <AutocompleteInput
                  value={formData.domiciliarioName}
                  onChange={(val) => {
                    setFormData(prev => ({ ...prev, domiciliarioName: val, usuarioId: null }));
                  }}
                  fetchUrl={`${API}/usuarios/search/domiciliarios`}
                  placeholder="Buscar domiciliario..."
                  displayKey="name"
                  onSelect={handleDomiciliarioSelect}
                />
              )}
            </div>
            <div className="input-group" style={{marginTop: '12px'}}>
              <label>Observaciones</label>
              <textarea name="observations" value={formData.observations} onChange={handleChange} disabled={isViewOnly} placeholder="Instrucciones especiales..." rows="3" className="textarea-field" />
            </div>
          </div>

          {/* PANEL DERECHO: CARRITO */}
          <div className="panel-estetico">
            <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              Contenido del Pedido
              {errors.cart && <span className="error-text" style={{ margin: 0 }}>Debes agregar al menos un producto.</span>}
            </h3>

            {!isViewOnly && (
              <div className="add-product-box">
                <div className="input-group-small" style={{marginBottom: '12px'}}>
                  <label>Buscar Producto</label>
                  <AutocompleteInput value={currentProduct} onChange={(val) => setCurrentProduct(val)} fetchUrl={`${API}/productos/search`} placeholder="Escribir nombre..." onSelect={handleProductSelect} />
                </div>
                
                <div className="add-product-row">
                  <div className="input-group-small" style={{flex: 0.8}}>
                    <label>Talla</label>
                    <select value={currentTalla} onChange={(e) => handleTallaChange(e.target.value)} className="custom-select">
                      {tallasDisponibles.length > 0 ? (
                        tallasDisponibles.map(t => <option key={t.talla} value={t.talla}>{t.talla} (stock: {t.stock})</option>)
                      ) : (
                        <option value="">Sin tallas</option>
                      )}
                    </select>
                  </div>
                  <div className="input-group-small" style={{flex: 0.6}}>
                    <label>Cant. <span className="required-asterisk">*</span></label>
                    <input type="number" min="1" max={stockActual || 999} value={currentCantidad} onChange={(e) => { setCurrentCantidad(e.target.value); setStockError(''); if (errors.currentCantidad) setErrors(prev => ({ ...prev, currentCantidad: false })); }} className={errors.currentCantidad ? 'input-error' : ''} />
                  </div>
                  <div className="input-group-small" style={{flex: 1.2}}>
                    <label>Precio Unit. <span className="required-asterisk">*</span></label>
                    <input type="number" min="0" value={currentValor} onChange={(e) => { setCurrentValor(e.target.value); if (errors.currentValor) setErrors(prev => ({ ...prev, currentValor: false })); }} placeholder="Ej: 120000" className={errors.currentValor ? 'input-error' : ''} />
                  </div>
                  <button className="btn-agregar-estetico" onClick={handleAddToCart}>Agregar</button>
                </div>
                {stockError && <span className="error-text" style={{marginTop: '6px'}}>{stockError}</span>}
              </div>
            )}

            <div className={`cart-container-estetico ${errors.cart ? 'cart-error-border' : ''}`}>
              <table className="cart-table-estetica">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Talla</th>
                    <th>Cant.</th>
                    <th>Total</th>
                    {!isViewOnly && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, index) => (
                    <tr key={index}>
                      <td style={{color: '#e4e4e7'}}>{item.product}</td>
                      <td>{item.talla}</td>
                      <td>{item.cantidad}</td>
                      <td style={{color: '#C9A24D', fontWeight: 500}}>{formatCOP(item.total)}</td>
                      {!isViewOnly && (
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn-remove-item" onClick={() => handleRemoveFromCart(index)}><Trash2 size={16} /></button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {cart.length === 0 && <tr><td colSpan={isViewOnly ? "4" : "5"} style={{textAlign: 'center', padding: '24px', fontStyle: 'italic', color: '#71717a'}}>No hay productos en el pedido.</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="total-pedido-box">
              <span>Total del Pedido:</span>
              <h2>{formatCOP(totalPedido)}</h2>
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