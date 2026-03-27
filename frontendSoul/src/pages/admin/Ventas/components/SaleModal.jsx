import { X, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatCOP } from '../../../../utils/currency';
import { AutocompleteInput } from '../../../../utils/AutocompleteInput';
import '../../../../utils/AutocompleteInput.css';
import './SaleModal.css';

const API = 'http://localhost:3000/api';
const metodosPago = ['Efectivo', 'Transferencia', 'Tarjeta de Crédito', 'Nequi', 'Daviplata'];

export const SaleModal = ({ isOpen, onClose, mode, saleData, onSave }) => {
  const [formData, setFormData] = useState({
    clientName: '', clientType: 'Natural',
    saleDate: new Date().toISOString().split('T')[0], 
    paymentMethod: metodosPago[0], observations: '', discount: 0 
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
    if (isOpen && saleData && (mode === 'edit' || mode === 'view')) {
      setFormData({
        clientName: saleData.clientName || '', clientType: saleData.clientType || 'Natural',
        saleDate: saleData.saleDate || '', paymentMethod: saleData.paymentMethod || metodosPago[0],
        observations: saleData.observations || '', discount: saleData.discount || 0
      });
      setCart(saleData.items || []);
      setErrors({});
    } else if (isOpen && mode === 'create') {
      setFormData({ clientName: '', clientType: 'Natural', saleDate: new Date().toISOString().split('T')[0], paymentMethod: metodosPago[0], observations: '', discount: 0 });
      setCart([]); setCurrentProduct(''); setCurrentCantidad(1); setCurrentValor('');
      setTallasDisponibles([]); setStockActual(0); setStockError(''); setErrors({});
    }
  }, [isOpen, mode, saleData]);

  if (!isOpen) return null;

  const isViewOnly = mode === 'view';
  const title = mode === 'create' ? 'Registrar Venta' : mode === 'edit' ? 'Editar Venta' : 'Detalle de la Venta';
  const buttonText = mode === 'create' ? 'Crear Venta' : 'Guardar Cambios';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: false }));
  };

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

  const handleAddToCart = () => {
    const newErrors = {};
    if (!currentProduct) { newErrors.cart = true; }
    if (!currentCantidad || currentCantidad <= 0) newErrors.currentCantidad = true;
    if (!currentValor || currentValor <= 0) newErrors.currentValor = true;
    if (!currentTalla) newErrors.currentTalla = true;

    // Validación de stock
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

  const subtotal = cart.reduce((acc, item) => acc + item.total, 0);
  const discountAmount = subtotal * (Number(formData.discount) / 100);
  const totalSale = subtotal - discountAmount;

  const handleSubmit = () => {
    const newErrors = {};
    if (!formData.clientName.trim()) newErrors.clientName = true;
    if (!formData.saleDate.trim()) newErrors.saleDate = true;
    if (cart.length === 0) newErrors.cart = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...newErrors }));
      return;
    }

    onSave({
      id: saleData ? saleData.id : null, ...formData, items: cart, 
      subtotal, total: totalSale, itemsCount: cart.length,
      status: saleData ? saleData.status : 'Activa', seller: saleData ? saleData.seller : 'Administrador'
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container modal-split-view">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body split-grid-body">
          {/* PANEL IZQUIERDO */}
          <div className="panel-estetico">
            <h3 className="panel-title">Información General</h3>
            <div className="form-group-stack">
              <div className="input-group">
                <label>Cliente <span className="required-asterisk">*</span></label>
                <input type="text" name="clientName" value={formData.clientName} onChange={handleChange} disabled={isViewOnly} placeholder="Nombre completo" className={errors.clientName ? 'input-error' : ''} />
                {errors.clientName && <span className="error-text">El cliente es obligatorio.</span>}
              </div>
              <div className="input-group">
                <label>Tipo de Cliente</label>
                <select name="clientType" value={formData.clientType} onChange={handleChange} disabled={isViewOnly} className="custom-select">
                  <option value="Natural">Natural</option>
                  <option value="Jurídico">Jurídico</option>
                </select>
              </div>
            </div>
            <div className="form-group-stack">
              <div className="input-group">
                <label>Fecha de Venta <span className="required-asterisk">*</span></label>
                <input type="date" name="saleDate" value={formData.saleDate} onChange={handleChange} disabled={isViewOnly} className={`date-input ${errors.saleDate ? 'input-error' : ''}`} />
                {errors.saleDate && <span className="error-text">La fecha es obligatoria.</span>}
              </div>
              <div className="input-group">
                <label>Método de Pago</label>
                <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} disabled={isViewOnly} className="custom-select">
                  {metodosPago.map(met => <option key={met} value={met}>{met}</option>)}
                </select>
              </div>
            </div>
            <div className="input-group" style={{marginTop: '12px'}}>
              <label>Observaciones</label>
              <textarea name="observations" value={formData.observations} onChange={handleChange} disabled={isViewOnly} placeholder="Detalles..." rows="3" className="textarea-field" />
            </div>
          </div>

          {/* PANEL DERECHO */}
          <div className="panel-estetico">
            <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              Productos de la Venta
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
                  {cart.length === 0 && <tr><td colSpan={isViewOnly ? "4" : "5"} style={{textAlign: 'center', padding: '24px', fontStyle: 'italic', color: '#71717a'}}>No hay productos en la venta.</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="sales-totals-section">
              <div className="discount-row">
                <div className="input-group-small discount-input-group">
                  <label>Descuento (%)</label>
                  <input type="number" min="0" max="100" name="discount" value={formData.discount} onChange={handleChange} disabled={isViewOnly} className="discount-input" />
                </div>
                <div className="subtotal-display">
                  <span>Subtotal:</span>
                  <span className="subtotal-amount">{formatCOP(subtotal)}</span>
                </div>
              </div>
              <div className="total-pedido-box" style={{marginTop: '12px'}}>
                <span>Total Final:</span>
                <h2>{formatCOP(totalSale)}</h2>
              </div>
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