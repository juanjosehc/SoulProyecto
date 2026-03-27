import { useState, useEffect, useRef } from 'react';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowLeft, ChevronDown, CheckCircle2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Catalogo.css';

const API = 'http://localhost:3000/api';

const formatCOP = (value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

export const Catalogo = () => {
  const navigate = useNavigate();
  const catalogRef = useRef(null);
  
  // Datos
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroGenero, setFiltroGenero] = useState('');
  const [filtroPrecioMax, setFiltroPrecioMax] = useState('');

  // Carrito
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState({});

  // Auth
  const [user, setUser] = useState(null);

  // Checkout
  const [isCheckout, setIsCheckout] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ phone: '', address: '', observations: '' });
  const [checkoutErrors, setCheckoutErrors] = useState({});
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Toast
  const [toast, setToast] = useState('');

  // Navbar scroll
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cargar usuario
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try { setUser(JSON.parse(userStr)); } catch {}
    }
  }, []);

  // Cargar productos y categorías
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [resProd, resCat] = await Promise.all([
          fetch(`${API}/productos/active`),
          fetch(`${API}/categorias`)
        ]);
        const dataProd = await resProd.json();
        const dataCat = await resCat.json();
        if (Array.isArray(dataProd)) setProductos(dataProd);
        if (Array.isArray(dataCat)) setCategorias(dataCat.filter(c => c.is_active !== false));
      } catch (error) {
        console.error('Error al cargar catálogo:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filtrar productos
  const productosFiltrados = productos.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategoria = !filtroCategoria || p.category === filtroCategoria;
    const matchGenero = !filtroGenero || p.gender === filtroGenero;
    const matchPrecio = !filtroPrecioMax || p.price <= Number(filtroPrecioMax);
    return matchSearch && matchCategoria && matchGenero && matchPrecio;
  });

  // Obtener imagen principal de un producto
  const getMainImage = (product) => {
    // El endpoint /active devuelve 'image' como la URL principal
    if (product.image) return product.image;
    if (!product.images || product.images.length === 0) return 'https://via.placeholder.com/400x300?text=Sin+Imagen';
    const imgs = product.images;
    if (typeof imgs[0] === 'string') return imgs[0];
    const principal = imgs.find(i => i.esPrincipal);
    return principal ? principal.url : imgs[0]?.url || imgs[0];
  };

  // Tallas disponibles (el endpoint /active devuelve 'sizes' como array simple)
  const getAvailableSizes = (product) => {
    if (Array.isArray(product.sizes)) return product.sizes;
    if (product.stockBySize) {
      return Object.entries(product.stockBySize).filter(([_, qty]) => Number(qty) > 0).map(([size]) => size);
    }
    return [];
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  // Carrito
  const handleSelectSize = (productId, size) => {
    setSelectedSizes(prev => ({ ...prev, [productId]: size }));
  };

  const handleAddToCart = (product) => {
    const size = selectedSizes[product.id];
    if (!size) return;
    
    const existingIndex = cart.findIndex(i => i.id === product.id && i.size === size);
    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([...cart, { 
        id: product.id, name: product.name, price: product.price, 
        size, quantity: 1, image: getMainImage(product) 
      }]);
    }
    showToast(`${product.name} (Talla ${size}) agregado al carrito`);
  };

  const updateQuantity = (index, delta) => {
    const updated = [...cart];
    updated[index].quantity += delta;
    if (updated[index].quantity <= 0) {
      updated.splice(index, 1);
    }
    setCart(updated);
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Checkout
  const handleCheckout = () => {
    if (!user) {
      showToast('Debes iniciar sesión para realizar un pedido');
      return;
    }
    setIsCheckout(true);
  };

  const handleCheckoutSubmit = async () => {
    const errors = {};
    if (!checkoutForm.phone.trim()) errors.phone = true;
    if (!checkoutForm.address.trim()) errors.address = true;

    if (Object.keys(errors).length > 0) {
      setCheckoutErrors(errors);
      return;
    }

    try {
      const orderData = {
        clientName: user.nombre,
        phone: checkoutForm.phone,
        deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deliveryAddress: checkoutForm.address,
        observations: checkoutForm.observations,
        orderStatus: 'Pendiente',
        items: cart.map(i => ({
          product: i.name, talla: i.size, cantidad: i.quantity,
          valorUnitario: i.price, total: i.price * i.quantity
        })),
        total: cartTotal,
        itemsCount: cart.length
      };

      const res = await fetch(`${API}/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (res.ok) {
        setOrderSuccess(true);
        setCart([]);
        setIsCheckout(false);
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Error al crear pedido');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const clearFilters = () => {
    setFiltroCategoria('');
    setFiltroGenero('');
    setFiltroPrecioMax('');
    setSearchTerm('');
  };

  return (
    <div className="store-container">
      {/* NAVBAR */}
      <nav className={`store-navbar ${scrolled ? 'nav-scrolled' : ''}`}>
        <span className="nav-brand">SOUL</span>
        
        <div className="nav-center">
          <div className="nav-search-container">
            <Search size={16} className="nav-search-icon" />
            <input 
              type="text" placeholder="Buscar sneakers..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} className="nav-search-input"
            />
          </div>
        </div>

        <div className="nav-right">
          {user ? (
            <div className="nav-user-section">
              <span className="nav-user-name">Hola, {user.nombre?.split(' ')[0]}</span>
              <button className="nav-auth-btn nav-logout" onClick={handleLogout}>Salir</button>
            </div>
          ) : (
            <div className="nav-auth-buttons">
              <button className="nav-auth-btn" onClick={() => navigate('/login')}>Iniciar Sesión</button>
              <button className="nav-auth-btn nav-register" onClick={() => navigate('/login')}>Registrarse</button>
            </div>
          )}
          <button className="nav-cart-btn" onClick={() => {setIsCartOpen(true); setOrderSuccess(false);}}>
            <ShoppingBag size={24} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </nav>

      {/* TOAST */}
      <div className={`toast-notification ${toast ? 'toast-visible' : ''}`}>{toast}</div>

      {/* HERO */}
      <section className="hero-section" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1920)'}}>
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 className="hero-title">SOUL SNEAKERS</h1>
          <p className="hero-subtitle">Descubre nuestra colección exclusiva de sneakers premium. Estilo, comodidad y calidad en cada paso.</p>
          <button className="hero-btn" onClick={() => catalogRef.current?.scrollIntoView({ behavior: 'smooth' })}>
            <ChevronDown size={20} /> Explorar Colección
          </button>
        </div>
      </section>

      {/* CATÁLOGO CON FILTROS */}
      <section className="catalog-section" ref={catalogRef}>
        <div className="catalog-header">
          <h2>Nuestra Colección</h2>
          <div className="catalog-line" />
        </div>

        <div className="catalog-layout">
          {/* SIDEBAR DE FILTROS */}
          <aside className="filters-sidebar">
            <div className="filters-header">
              <h3>Filtros</h3>
              <button className="btn-clear-filters" onClick={clearFilters}>Limpiar</button>
            </div>

            <div className="filter-group">
              <label>Categoría</label>
              <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
                <option value="">Todas</option>
                {categorias.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
              </select>
            </div>

            <div className="filter-group">
              <label>Género</label>
              <select value={filtroGenero} onChange={(e) => setFiltroGenero(e.target.value)}>
                <option value="">Todos</option>
                <option value="Hombre">Hombre</option>
                <option value="Mujer">Mujer</option>
                <option value="Unisex">Unisex</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Precio Máximo</label>
              <input 
                type="number" min="0" value={filtroPrecioMax} 
                onChange={(e) => setFiltroPrecioMax(e.target.value)}
                placeholder="Ej: 500000"
              />
            </div>

            <div className="filter-count">
              {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''}
            </div>
          </aside>

          {/* GRID DE PRODUCTOS */}
          <div className="products-grid">
            {isLoading ? (
              <div className="loading-state">Cargando productos...</div>
            ) : productosFiltrados.length > 0 ? (
              productosFiltrados.map(product => {
                const availableSizes = getAvailableSizes(product);
                return (
                  <div key={product.id} className="product-card">
                    <div className="product-image-container">
                      <img src={getMainImage(product)} alt={product.name} />
                      <span className="product-category-tag">{product.category}</span>
                    </div>
                    <div className="product-info">
                      <h3 className="product-name">{product.name}</h3>
                      <p className="product-price">{formatCOP(product.price)}</p>
                      
                      {availableSizes.length > 0 && (
                        <div className="size-selector">
                          <span className="size-label">Talla:</span>
                          <div className="sizes-list">
                            {availableSizes.map(size => (
                              <button key={size} 
                                className={`size-btn ${selectedSizes[product.id] === size ? 'selected' : ''}`}
                                onClick={() => handleSelectSize(product.id, size)}>
                                {size}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <button 
                        className={`btn-add-cart ${selectedSizes[product.id] ? 'ready' : ''}`}
                        onClick={() => handleAddToCart(product)}
                        disabled={!selectedSizes[product.id]}>
                        {selectedSizes[product.id] ? 'Agregar al Carrito' : 'Selecciona una talla'}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-catalog">
                <p>No se encontraron productos con los filtros seleccionados.</p>
                <button className="btn-clear-filters" onClick={clearFilters}>Limpiar filtros</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* OVERLAY CARRITO */}
      <div className={`cart-overlay ${isCartOpen ? 'open' : ''}`} onClick={() => setIsCartOpen(false)} />
      
      {/* DRAWER CARRITO */}
      <div className={`cart-drawer ${isCartOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2>{isCheckout ? 'Datos de Envío' : 'Tu Carrito'}</h2>
          <button className="btn-close-cart" onClick={() => {setIsCartOpen(false); setIsCheckout(false); setOrderSuccess(false);}}>
            <X size={24} />
          </button>
        </div>

        {orderSuccess ? (
          <div className="cart-success-state">
            <CheckCircle2 size={64} className="success-icon" />
            <h3>¡Pedido Registrado!</h3>
            <p>Tu pedido ha sido creado exitosamente. Lo rastrearemos y te notificaremos cuando esté en camino.</p>
            <button className="btn-continue-shopping" onClick={() => {setIsCartOpen(false); setOrderSuccess(false);}}>
              Seguir Comprando
            </button>
          </div>
        ) : isCheckout ? (
          <div className="checkout-form-container">
            <button className="btn-back-to-cart" onClick={() => setIsCheckout(false)}>
              <ArrowLeft size={16} /> Volver al carrito
            </button>
            <div className="checkout-inputs-wrapper">
              <div className="input-group-catalog">
                <label>Teléfono <span className="required-asterisk">*</span></label>
                <input type="text" value={checkoutForm.phone} 
                  onChange={(e) => { setCheckoutForm({...checkoutForm, phone: e.target.value}); if(checkoutErrors.phone) setCheckoutErrors({...checkoutErrors, phone: false}); }}
                  placeholder="Ej: 3001234567" className={checkoutErrors.phone ? 'input-error' : ''} />
                {checkoutErrors.phone && <span className="error-text">El teléfono es obligatorio.</span>}
              </div>
              <div className="input-group-catalog">
                <label>Dirección de Entrega <span className="required-asterisk">*</span></label>
                <input type="text" value={checkoutForm.address}
                  onChange={(e) => { setCheckoutForm({...checkoutForm, address: e.target.value}); if(checkoutErrors.address) setCheckoutErrors({...checkoutErrors, address: false}); }}
                  placeholder="Ej: Calle 123 #45-67" className={checkoutErrors.address ? 'input-error' : ''} />
                {checkoutErrors.address && <span className="error-text">La dirección es obligatoria.</span>}
              </div>
              <div className="input-group-catalog">
                <label>Observaciones</label>
                <textarea value={checkoutForm.observations}
                  onChange={(e) => setCheckoutForm({...checkoutForm, observations: e.target.value})}
                  placeholder="Instrucciones especiales..." rows="3" />
              </div>
            </div>
            <div className="cart-footer">
              <div className="cart-total-row grand-total">
                <span>Total</span>
                <span>{formatCOP(cartTotal)}</span>
              </div>
              <button className="btn-checkout" onClick={handleCheckoutSubmit}>
                Confirmar Pedido
              </button>
            </div>
          </div>
        ) : (
          <>
            {cart.length === 0 ? (
              <div className="cart-empty-state">
                <ShoppingBag size={48} className="empty-icon" />
                <p>Tu carrito está vacío</p>
              </div>
            ) : (
              <>
                <div className="cart-items-container">
                  {cart.map((item, index) => (
                    <div key={`${item.id}-${item.size}`} className="cart-item">
                      <img src={item.image} alt={item.name} className="cart-item-img" />
                      <div className="cart-item-details">
                        <h4 className="cart-item-name">{item.name}</h4>
                        <p className="cart-item-size">Talla: {item.size}</p>
                        <p className="cart-item-price">{formatCOP(item.price)}</p>
                        <div className="cart-item-actions">
                          <div className="quantity-controls">
                            <button onClick={() => updateQuantity(index, -1)}><Minus size={14} /></button>
                            <span>{item.quantity}</span>
                            <button onClick={() => updateQuantity(index, 1)}><Plus size={14} /></button>
                          </div>
                          <button className="btn-close-cart" onClick={() => removeFromCart(index)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cart-footer">
                  <div className="cart-total-row">
                    <span>Subtotal ({cartCount} artículos)</span>
                    <span>{formatCOP(cartTotal)}</span>
                  </div>
                  <div className="cart-total-row grand-total">
                    <span>Total</span>
                    <span>{formatCOP(cartTotal)}</span>
                  </div>
                  <button className="btn-checkout" onClick={handleCheckout}>
                    {user ? 'Proceder al Envío' : 'Iniciar Sesión para Comprar'}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};