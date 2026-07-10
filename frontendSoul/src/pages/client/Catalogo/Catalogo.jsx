import { useState, useEffect, useRef } from 'react';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowLeft, ChevronDown, CheckCircle2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../../config/api';
import './Catalogo.css';

const formatCOP = (value) => {
  const num = Number(value);
  return isNaN(num) ? '$0' : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(num);
};

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
  const [filtroPrecioMin, setFiltroPrecioMin] = useState('');
  const [filtroPrecioMax, setFiltroPrecioMax] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8;

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
  const [checkoutPhoneError, setCheckoutPhoneError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Para feedback de carga global

  // Historial de Pedidos
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [pedidosCliente, setPedidosCliente] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState(null);

  // Galería de imágenes
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Toast
  const [toast, setToast] = useState('');

  // Navbar scroll
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const hasLoadedCartFromDB = useRef(false);

  // Métodos auxiliares para sincronización del carrito
  const cargarCarrito = async (token) => {
    try {
      const res = await fetch(`${API_URL}/carrito`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setCart(data);
      }
    } catch (error) {
      console.error('Error al cargar el carrito:', error);
    } finally {
      hasLoadedCartFromDB.current = true;
    }
  };

  const sincronizarCarrito = async (items, token) => {
    try {
      await fetch(`${API_URL}/carrito`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items: items.map(i => ({ id: i.id, size: i.size, quantity: i.quantity })) })
      });
    } catch (error) {
      console.error('Error al sincronizar el carrito:', error);
    }
  };

  const cargarCarritoYFusionar = async (token, tempCart) => {
    try {
      const res = await fetch(`${API_URL}/carrito`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const dbCart = await res.json();
        if (Array.isArray(dbCart)) {
          const mergedCart = [...dbCart];
          for (const tempItem of tempCart) {
            const index = mergedCart.findIndex(dbItem => dbItem.id === tempItem.id && dbItem.size === tempItem.size);
            if (index >= 0) {
              const newQty = mergedCart[index].quantity + tempItem.quantity;
              const maxStock = mergedCart[index].maxStock || tempItem.maxStock || newQty;
              mergedCart[index].quantity = Math.min(newQty, maxStock);
            } else {
              mergedCart.push(tempItem);
            }
          }
          setCart(mergedCart);
          await sincronizarCarrito(mergedCart, token);
          localStorage.removeItem('cart');
        }
      }
    } catch (error) {
      console.error('Error al cargar y fusionar el carrito:', error);
    } finally {
      hasLoadedCartFromDB.current = true;
    }
  };

  // Cargar usuario y su carrito de BD si está autenticado
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (userStr && token) {
      try {
        const parsedUser = JSON.parse(userStr);
        setUser(parsedUser);
        if (parsedUser.tipo === 'cliente') {
          const tempCartStr = localStorage.getItem('cart');
          let tempCart = [];
          if (tempCartStr) {
            try {
              tempCart = JSON.parse(tempCartStr);
            } catch (e) {
              console.error(e);
            }
          }
          if (tempCart.length > 0) {
            cargarCarritoYFusionar(token, tempCart);
          } else {
            cargarCarrito(token);
          }
        } else {
          hasLoadedCartFromDB.current = true;
        }
      } catch (err) {
        console.error('Error al parsear usuario local:', err);
        hasLoadedCartFromDB.current = true;
      }
    } else {
      const tempCartStr = localStorage.getItem('cart');
      if (tempCartStr) {
        try {
          setCart(JSON.parse(tempCartStr));
        } catch (e) {
          console.error(e);
        }
      }
      hasLoadedCartFromDB.current = true;
    }
  }, []);

  // Sincronizar el carrito con la base de datos cuando cambie localmente
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (user && user.tipo === 'cliente' && token && hasLoadedCartFromDB.current) {
      sincronizarCarrito(cart, token);
    } else if (!user) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart, user]);

  // Cargar productos y categorías
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [resProd, resCat] = await Promise.all([
          fetch(`${API_URL}/productos/active`),
          fetch(`${API_URL}/categorias`)
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
    const matchSearch = !searchTerm || (p.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategoria = !filtroCategoria || p.category === filtroCategoria;
    const matchGenero = !filtroGenero || 
      p.gender === filtroGenero || 
      (p.gender === 'Unisex' && (filtroGenero === 'Hombre' || filtroGenero === 'Mujer'));
    const matchPrecioMin = !filtroPrecioMin || Number(p.price || 0) >= Number(filtroPrecioMin);
    const matchPrecioMax = !filtroPrecioMax || Number(p.price || 0) <= Number(filtroPrecioMax);
    return matchSearch && matchCategoria && matchGenero && matchPrecioMin && matchPrecioMax;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filtroCategoria, filtroGenero, filtroPrecioMin, filtroPrecioMax]);

  const totalPages = Math.ceil(productosFiltrados.length / productsPerPage) || 1;
  const activePage = Math.min(currentPage, totalPages);
  const currentProducts = productosFiltrados.slice((activePage - 1) * productsPerPage, activePage * productsPerPage);

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

  // Galería de imágenes
  const openGallery = (product) => {
    let imgs = [];
    if (Array.isArray(product.images)) {
      imgs = product.images.filter(img => img && img !== 'null');
    }
    if (imgs.length === 0 && product.image) {
      imgs = [product.image];
    }
    if (imgs.length === 0) return;
    setGalleryImages(imgs);
    setGalleryIndex(0);
    setGalleryOpen(true);
  };

  const closeGallery = () => {
    setGalleryOpen(false);
    setGalleryImages([]);
    setGalleryIndex(0);
  };

  const galleryPrev = () => {
    setGalleryIndex(prev => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const galleryNext = () => {
    setGalleryIndex(prev => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  };

  // Carrito
  const handleSelectSize = (productId, size) => {
    setSelectedSizes(prev => ({ ...prev, [productId]: size }));
  };

  const handleAddToCart = (product) => {
    const size = selectedSizes[product.id];
    if (!size) return;
    
    const existingIndex = cart.findIndex(i => i.id === product.id && i.size === size);
    const maxStock = product.stockBySize?.[size] || 0;

    if (existingIndex >= 0) {
      const updated = [...cart];
      if (updated[existingIndex].quantity < maxStock) {
        updated[existingIndex].quantity += 1;
        setCart(updated);
        showToast(`${product.name} (Talla ${size}) agregado al carrito`);
      } else {
        showToast(`Lo sentimos, solo hay ${maxStock} unidades en stock.`);
      }
    } else {
      if (maxStock > 0) {
        setCart([...cart, { 
          id: product.id, name: product.name, price: product.price, 
          size, quantity: 1, image: getMainImage(product),
          maxStock: maxStock // Guardamos el stock máximo para controles en el drawer
        }]);
        showToast(`${product.name} (Talla ${size}) agregado al carrito`);
      } else {
        showToast('Producto sin stock en esta talla.');
      }
    }
  };

  const updateQuantity = (index, delta) => {
    const updated = [...cart];
    const item = updated[index];
    
    if (delta > 0 && item.quantity >= item.maxStock) {
      showToast(`¡Alerta! No puedes añadir más de ${item.maxStock} unidades. Supera el stock disponible.`);
      alert(`No es posible agregar más unidades de ${item.name} (Talla ${item.size}). El stock máximo disponible es ${item.maxStock}.`);
      return;
    }

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
      showToast('Debes iniciar sesión para realizar la compra');
      navigate('/login', { state: { message: 'Debes iniciar sesión para realizar la compra.' } });
      return;
    }
    setCheckoutPhoneError('');
    setIsCheckout(true);
  };

  const handleCheckoutSubmit = async () => {
    const errors = {};
    if (!checkoutForm.phone.trim()) errors.phone = true;
    if (!checkoutForm.address.trim()) errors.address = true;
    if (checkoutPhoneError) return;

    if (Object.keys(errors).length > 0) {
      setCheckoutErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const orderData = {
        clienteId: user.id, // NUEVO: Asociamos el ID del cliente logueado
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

      const res = await fetch(`${API_URL}/pedidos`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      if (res.ok) {
        setOrderSuccess(true);
        // Limpiamos el carrito local. El useEffect se encargará de limpiar el carrito de la base de datos
        setCart([]);
        setIsCheckout(false);
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Error al crear pedido');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
    setUser(null);
    setCart([]); // Limpiar carrito local
    hasLoadedCartFromDB.current = false;
  };

  const cargarHistorialPedidos = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`${API_URL}/pedidos/mi-historial`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setPedidosCliente(data);
        }
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleOpenHistory = () => {
    setIsHistoryOpen(true);
    cargarHistorialPedidos();
  };

  const clearFilters = () => {
    setFiltroCategoria('');
    setFiltroGenero('');
    setFiltroPrecioMin('');
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
              {user.tipo === 'cliente' && (
                <button className="nav-auth-btn" onClick={handleOpenHistory}>Mis Pedidos</button>
              )}
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

        <div className="catalog-layout flex flex-col lg:flex-row gap-8">
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
              <label>Rango de Precio</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="number" min="0" value={filtroPrecioMin} 
                  onChange={(e) => setFiltroPrecioMin(e.target.value)}
                  placeholder="Mín"
                  style={{ width: '50%' }}
                />
                <input 
                  type="number" min="0" value={filtroPrecioMax} 
                  onChange={(e) => setFiltroPrecioMax(e.target.value)}
                  placeholder="Máx"
                  style={{ width: '50%' }}
                />
              </div>
            </div>

            <div className="filter-count">
              {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''}
            </div>
          </aside>

          {/* WRAPPER PARA EL CONTENIDO DE PRODUCTOS Y PAGINACIÓN */}
          <div className="products-content-wrapper flex-1 w-full">
            {/* GRID DE PRODUCTOS */}
            <div className="products-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
              {isLoading ? (
                <div className="loading-state">Cargando productos...</div>
              ) : currentProducts.length > 0 ? (
                currentProducts.map(product => {
                  const availableSizes = getAvailableSizes(product);
                  return (
                    <div key={product.id} className="product-card w-full">
                      <div className="product-image-container" onClick={() => openGallery(product)} style={{cursor: 'pointer'}}>
                        <img src={getMainImage(product)} alt={product.name} />
                        <span className="product-category-tag">{product.category}</span>
                        {Array.isArray(product.images) && product.images.length > 1 && (
                          <span className="product-gallery-hint">{product.images.length} fotos</span>
                        )}
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

            {/* PAGINACIÓN DEL CATÁLOGO */}
            {totalPages > 1 && (
              <div className="pagination-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '32px', width: '100%' }}>
                <button className="btn-page" onClick={() => { setCurrentPage(p => Math.max(p - 1, 1)); catalogRef.current?.scrollIntoView({ behavior: 'smooth' }); }} disabled={activePage === 1}>
                  <ChevronLeft size={18} />
                </button>
                <span className="page-indicator" style={{ color: '#a1a1aa', fontSize: '14px', fontWeight: '500' }}>Página {activePage} de {totalPages}</span>
                <button className="btn-page" onClick={() => { setCurrentPage(p => Math.min(p + 1, totalPages)); catalogRef.current?.scrollIntoView({ behavior: 'smooth' }); }} disabled={activePage === totalPages}>
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* MODAL GALERÍA DE IMÁGENES */}
      {galleryOpen && (
        <div className="gallery-overlay" onClick={closeGallery}>
          <div className="gallery-modal" onClick={(e) => e.stopPropagation()}>
            <button className="gallery-close" onClick={closeGallery}>
              <X size={24} />
            </button>
            <div className="gallery-content">
              {galleryImages.length > 1 && (
                <button className="gallery-nav gallery-prev" onClick={galleryPrev}>
                  <ChevronLeft size={32} />
                </button>
              )}
              <img
                src={galleryImages[galleryIndex]}
                alt={`Imagen ${galleryIndex + 1}`}
                className="gallery-image"
              />
              {galleryImages.length > 1 && (
                <button className="gallery-nav gallery-next" onClick={galleryNext}>
                  <ChevronRight size={32} />
                </button>
              )}
            </div>
            {galleryImages.length > 1 && (
              <div className="gallery-dots">
                {galleryImages.map((_, i) => (
                  <button
                    key={i}
                    className={`gallery-dot ${i === galleryIndex ? 'active' : ''}`}
                    onClick={() => setGalleryIndex(i)}
                  />
                ))}
              </div>
            )}
            <p className="gallery-counter">{galleryIndex + 1} / {galleryImages.length}</p>
          </div>
        </div>
      )}

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
                <input 
                  type="text" 
                  value={checkoutForm.phone} 
                  onChange={(e) => {
                    const val = e.target.value;
                    const cleanVal = val.replace(/[^0-9]/g, '');
                    if (val !== cleanVal && !/^[0-9]*$/.test(val)) {
                      setCheckoutPhoneError('Solo se permiten números');
                    } else if (cleanVal.length > 10) {
                      setCheckoutPhoneError('El teléfono debe tener máximo 10 dígitos');
                    } else {
                      setCheckoutPhoneError('');
                    }
                    setCheckoutForm({...checkoutForm, phone: cleanVal});
                    if(checkoutErrors.phone) setCheckoutErrors({...checkoutErrors, phone: false});
                  }}
                  placeholder="Ej: 3001234567" 
                  className={checkoutErrors.phone || checkoutPhoneError ? 'input-error' : ''} 
                />
                {checkoutPhoneError && <span className="phone-error-msg" style={{color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block'}}>{checkoutPhoneError}</span>}
                {checkoutErrors.phone && !checkoutPhoneError && <span className="error-text">El teléfono es obligatorio.</span>}
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
              <button className="btn-checkout" onClick={handleCheckoutSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Registrando Pedido...' : 'Confirmar Pedido'}
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
                            <button 
                              onClick={() => updateQuantity(index, 1)}
                            >
                              <Plus size={14} />
                            </button>
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

      {/* MODAL DE HISTORIAL DE PEDIDOS */}
      {isHistoryOpen && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-container" style={{ maxWidth: '800px', width: '90%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', overflow: 'hidden' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #27272a' }}>
              <h2 style={{ color: '#ffffff', margin: 0, fontSize: '1.25rem' }}>Historial de Pedidos</h2>
              <button className="btn-close" onClick={() => setIsHistoryOpen(false)} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {isLoadingHistory ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#a1a1aa' }}>Cargando historial de pedidos...</div>
              ) : pedidosCliente.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#a1a1aa', fontStyle: 'italic' }}>No has realizado ningún pedido aún.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', color: '#e4e4e7' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #27272a', color: '#a1a1aa' }}>
                        <th style={{ padding: '12px 8px' }}>Código</th>
                        <th style={{ padding: '12px 8px' }}>Fecha</th>
                        <th style={{ padding: '12px 8px' }}>Total</th>
                        <th style={{ padding: '12px 8px' }}>Estado</th>
                        <th style={{ padding: '12px 8px', textAlign: 'right' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedidosCliente.map(ped => (
                        <tr key={ped.id} style={{ borderBottom: '1px solid #27272a' }}>
                          <td style={{ padding: '12px 8px', fontWeight: 'bold', color: '#ffffff' }}>{ped.code}</td>
                          <td style={{ padding: '12px 8px' }}>{ped.deliveryDate}</td>
                          <td style={{ padding: '12px 8px', color: '#C9A24D', fontWeight: '500' }}>{formatCOP(ped.total)}</td>
                          <td style={{ padding: '12px 8px' }}>
                            <span className="status-badge" style={{
                              padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500',
                              backgroundColor: ped.orderStatus === 'Completado' ? 'rgba(34, 197, 94, 0.1)' :
                                              ped.orderStatus === 'Anulado' ? 'rgba(239, 68, 68, 0.1)' :
                                              ped.orderStatus === 'En tránsito' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(249, 115, 22, 0.1)',
                              color: ped.orderStatus === 'Completado' ? '#22c55e' :
                                     ped.orderStatus === 'Anulado' ? '#ef4444' :
                                     ped.orderStatus === 'En tránsito' ? '#3b82f6' : '#f97316'
                            }}>
                              {ped.orderStatus}
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                            <button className="btn-secondary" onClick={() => setSelectedPedido(ped)} style={{ padding: '6px 12px', fontSize: '13px', cursor: 'pointer' }}>
                              Ver Detalle
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ padding: '16px 20px', borderTop: '1px solid #27272a', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#09090b' }}>
              <button className="btn-secondary" onClick={() => setIsHistoryOpen(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* DETALLE DE PEDIDO DEL HISTORIAL */}
      {selectedPedido && (
        <div className="modal-overlay" style={{ zIndex: 1300 }}>
          <div className="modal-container" style={{ maxWidth: '650px', width: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', overflow: 'hidden' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #27272a' }}>
              <h2 style={{ color: '#ffffff', margin: 0, fontSize: '1.25rem' }}>Detalle de Pedido {selectedPedido.code}</h2>
              <button className="btn-close" onClick={() => setSelectedPedido(null)} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Info de Envío */}
              <div style={{ backgroundColor: '#09090b', padding: '16px', borderRadius: '8px', border: '1px solid #27272a' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#C9A24D' }}>Información de Envío</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', color: '#a1a1aa' }}>
                  <div>
                    <span style={{ display: 'block', fontWeight: '600', color: '#ffffff' }}>Dirección:</span>
                    {selectedPedido.deliveryAddress}
                  </div>
                  <div>
                    <span style={{ display: 'block', fontWeight: '600', color: '#ffffff' }}>Teléfono:</span>
                    {selectedPedido.phone}
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ display: 'block', fontWeight: '600', color: '#ffffff' }}>Observaciones:</span>
                    {selectedPedido.observations || 'Ninguna'}
                  </div>
                </div>
              </div>

              {/* Motivo de anulación condicional */}
              {selectedPedido.orderStatus === 'Anulado' && (
                <div style={{ border: '1px solid #ef4444', padding: '12px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.05)', fontSize: '13px' }}>
                  <span style={{ color: '#ef4444', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Motivo de Anulación</span>
                  <p style={{ color: '#f4f4f5', margin: 0, lineHeight: '1.4' }}>{selectedPedido.motivoAnulacion || 'No especificado'}</p>
                </div>
              )}

              {/* Artículos */}
              <div>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#ffffff' }}>Productos Adquiridos</h3>
                <div style={{ border: '1px solid #27272a', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', color: '#e4e4e7' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#09090b', borderBottom: '1px solid #27272a', color: '#a1a1aa' }}>
                        <th style={{ padding: '8px 12px' }}>Producto</th>
                        <th style={{ padding: '8px 12px' }}>Talla</th>
                        <th style={{ padding: '8px 12px' }}>Cant.</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPedido.items?.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #27272a' }}>
                          <td style={{ padding: '8px 12px', color: '#ffffff' }}>{item.product}</td>
                          <td style={{ padding: '8px 12px' }}>{item.talla}</td>
                          <td style={{ padding: '8px 12px' }}>{item.cantidad}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', color: '#C9A24D', fontWeight: '500' }}>{formatCOP(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #3f3f46', paddingTop: '16px' }}>
                <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '15px' }}>Total Pagado:</span>
                <span style={{ color: '#C9A24D', fontWeight: 'bold', fontSize: '20px' }}>{formatCOP(selectedPedido.total)}</span>
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '16px 20px', borderTop: '1px solid #27272a', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#09090b' }}>
              <button className="btn-secondary" onClick={() => setSelectedPedido(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};