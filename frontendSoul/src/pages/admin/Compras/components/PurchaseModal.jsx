import { X, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AutocompleteInput } from '../../../../utils/AutocompleteInput';
import '../../../../utils/AutocompleteInput.css';
import './PurchaseModal.css';

const API = 'http://localhost:3000/api';
const metodosPago = ['Transferencia', 'Efectivo', 'Tarjeta de Crédito'];
const tallasList = ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11'];

export const PurchaseModal = ({ isOpen, onClose, mode, purchaseData, onSave }) => {
  const [formData, setFormData] = useState({
    provider: '',
    date: new Date().toISOString().split('T')[0], 
    paymentMethod: metodosPago[0],
  });

  const [cart, setCart] = useState([]);

  // Estados para la sección de "Agregar Producto"
  const [currentProduct, setCurrentProduct] = useState('');
  const [currentTalla, setCurrentTalla] = useState(tallasList[0]);
  const [currentCantidad, setCurrentCantidad] = useState(1);
  const [currentValor, setCurrentValor] = useState('');

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && purchaseData && (mode === 'edit' || mode === 'view')) {
      setFormData({
        provider: purchaseData.supplier || purchaseData.provider || '',
        date: purchaseData.date || new Date().toISOString().split('T')[0],
        paymentMethod: purchaseData.paymentMethod || metodosPago[0],
      });
      setCart(Array.isArray(purchaseData.items) ? purchaseData.items : []);
      setErrors({});
    } else if (isOpen && mode === 'create') {
      setFormData({ 
        provider: '', 
        date: new Date().toISOString().split('T')[0], 
        paymentMethod: metodosPago[0] 
      });
      setCart([]);
      setCurrentProduct('');
      setCurrentCantidad(1);
      setCurrentValor('');
      setErrors({});
    }
  }, [isOpen, mode, purchaseData]);

  if (!isOpen) return null;

  const isViewOnly = mode === 'view';
  const title = mode === 'create' ? 'Registrar Compra' : mode === 'edit' ? 'Editar Compra' : 'Detalle de Compra';
  const buttonText = mode === 'create' ? 'Crear Compra' : 'Guardar Cambios';

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
  };

  const handleAddToCart = () => {
    const newErrors = {};
    if (!currentProduct) newErrors.cart = true;
    if (!currentCantidad || currentCantidad <= 0) newErrors.currentCantidad = true;
    if (!currentValor || currentValor <= 0) newErrors.currentValor = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    const newItem = {
      product: currentProduct,
      talla: currentTalla,
      cantidad: Number(currentCantidad),
      valorUnitario: Number(currentValor),
      total: Number(currentCantidad) * Number(currentValor)
    };

    setCart([...cart, newItem]);
    setCurrentCantidad(1);
    setCurrentValor('');
    setErrors({});
  };

  const handleRemoveFromCart = (indexToRemove) => {
    setCart(cart.filter((_, index) => index !== indexToRemove));
  };

  const totalCompra = cart.reduce((acc, item) => acc + item.total, 0);

  const handleSubmit = () => {
    const newErrors = {};
    if (!formData.provider.trim()) newErrors.provider = true;
    if (cart.length === 0) newErrors.cart = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      id: purchaseData ? purchaseData.id : null,
      ...formData,
      items: cart,
      total: totalCompra,
      itemsCount: cart.length,
      isActive: purchaseData ? purchaseData.isActive : true
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container modal-large-purchase">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          <div className="purchase-grid-3">
            <div className="input-group">
              <label>Proveedor <span className="required-asterisk">*</span></label>
              {isViewOnly ? (
                <input type="text" value={formData.provider} disabled />
              ) : (
                <AutocompleteInput
                  value={formData.provider}
                  onChange={(val) => { setFormData({...formData, provider: val}); if(errors.provider) setErrors({...errors, provider: false}); }}
                  fetchUrl={`${API}/proveedores/search`}
                  placeholder="Buscar proveedor..."
                  className={errors.provider ? 'input-error' : ''}
                />
              )}
              {errors.provider && <span className="error-text">Seleccione un proveedor.</span>}
            </div>
            <div className="input-group">
              <label>Fecha de Compra</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} disabled={isViewOnly} className="date-input" />
            </div>
            <div className="input-group">
              <label>Método de Pago</label>
              <select value={formData.paymentMethod} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})} disabled={isViewOnly} className="custom-select">
                {metodosPago.map(met => <option key={met} value={met}>{met}</option>)}
              </select>
            </div>
          </div>

          {!isViewOnly && (
            <div className="add-product-section">
              <h3 className="section-subtitle">Agregar Producto</h3>
              
              <div className="input-group full-width">
                <label>Buscar Producto</label>
                <AutocompleteInput
                  value={currentProduct}
                  onChange={(val) => setCurrentProduct(val)}
                  fetchUrl={`${API}/productos/search`}
                  placeholder="Escribir nombre del producto..."
                  onSelect={(item) => {
                    setCurrentProduct(item.name);
                    if (item.price) setCurrentValor(item.price);
                  }}
                />
              </div>

              <div className="add-product-row">
                <div className="input-group-small">
                  <label>Talla</label>
                  <select value={currentTalla} onChange={(e) => setCurrentTalla(e.target.value)} className="custom-select">
                    {tallasList.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                
                <div className="input-group-small">
                  <label>Cantidad <span className="required-asterisk">*</span></label>
                  <input 
                    type="number" min="1" value={currentCantidad} 
                    onChange={(e) => { setCurrentCantidad(e.target.value); if(errors.currentCantidad) setErrors({...errors, currentCantidad: false}); }}
                    className={errors.currentCantidad ? 'input-error' : ''}
                  />
                  {errors.currentCantidad && <span className="error-text-absolute">Requerido</span>}
                </div>

                <div className="input-group-small">
                  <label>Valor Unitario <span className="required-asterisk">*</span></label>
                  <input 
                    type="number" min="0" value={currentValor} 
                    onChange={(e) => { setCurrentValor(e.target.value); if(errors.currentValor) setErrors({...errors, currentValor: false}); }}
                    placeholder="Ej: 50000" 
                    className={errors.currentValor ? 'input-error' : ''}
                  />
                  {errors.currentValor && <span className="error-text-absolute">Requerido</span>}
                </div>
                
                <button className="btn-agregar" onClick={handleAddToCart}>
                  Agregar
                </button>
              </div>
            </div>
          )}

          <div className="cart-section">
            <h3 className="section-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              Productos Agregados
              {errors.cart && <span className="error-text" style={{ margin: 0 }}>Debes agregar al menos un producto a la tabla.</span>}
            </h3>
            
            <div className={`cart-table-container ${errors.cart ? 'cart-error-border' : ''}`}>
              <table className="cart-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Talla</th>
                    <th>Cantidad</th>
                    <th>Valor Unit.</th>
                    <th>Total</th>
                    {!isViewOnly && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, index) => (
                    <tr key={index}>
                      <td className="cart-prod-name">{item.product}</td>
                      <td>{item.talla}</td>
                      <td>{item.cantidad}</td>
                      <td>{formatCurrency(item.valorUnitario)}</td>
                      <td className="cart-total-cell">{formatCurrency(item.total)}</td>
                      {!isViewOnly && (
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn-remove-item" onClick={() => handleRemoveFromCart(index)} title="Quitar producto">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {cart.length === 0 && (
                    <tr>
                      <td colSpan={isViewOnly ? "5" : "6"} className="cart-empty">
                        No hay productos en esta compra. Agrega uno arriba.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="cart-grand-total">
              <span>Total General de la Compra:</span>
              <span className="grand-total-amount">{formatCurrency(totalCompra)}</span>
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