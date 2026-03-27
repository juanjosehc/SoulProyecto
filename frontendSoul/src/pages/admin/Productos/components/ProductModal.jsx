import { X, Upload, Star, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import './ProductModal.css';

const API = 'http://localhost:3000/api';
const tallasList = ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11'];
const generosList = ['Unisex', 'Hombre', 'Mujer'];

export const ProductModal = ({ isOpen, onClose, mode, productData, onSave }) => {
  const [formData, setFormData] = useState({
    name: '', category: '', price: '', gender: 'Unisex',
    stockBySize: tallasList.reduce((acc, size) => ({ ...acc, [size]: '' }), {})
  });

  const [images, setImages] = useState([]); // { url, esPrincipal, isUploading }
  const [categoriasDB, setCategoriasDB] = useState([]);
  const [errors, setErrors] = useState({});
  const [uploadingCount, setUploadingCount] = useState(0);

  // Cargar categorías activas al abrir modal
  useEffect(() => {
    if (isOpen) {
      const fetchCategorias = async () => {
        try {
          const res = await fetch(`${API}/categorias`);
          const data = await res.json();
          if (Array.isArray(data)) {
            setCategoriasDB(data.filter(c => c.is_active !== false));
          }
        } catch (error) {
          console.error('Error al cargar categorías:', error);
        }
      };
      fetchCategorias();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && productData && (mode === 'edit' || mode === 'view')) {
      setFormData({
        name: productData.name || '',
        category: productData.category || '',
        price: productData.price || '',
        gender: productData.gender || 'Unisex',
        stockBySize: productData.stockBySize || tallasList.reduce((acc, size) => ({ ...acc, [size]: '' }), {})
      });
      // Cargar imágenes existentes
      if (productData.images && Array.isArray(productData.images)) {
        const loadedImages = productData.images.map(img => {
          if (typeof img === 'string') {
            return { url: img, esPrincipal: false };
          }
          return { url: img.url, esPrincipal: img.esPrincipal || false };
        });
        // Marcar la primera como principal si ninguna lo es
        if (loadedImages.length > 0 && !loadedImages.some(i => i.esPrincipal)) {
          loadedImages[0].esPrincipal = true;
        }
        setImages(loadedImages);
      } else {
        setImages([]);
      }
      setErrors({});
    } else if (isOpen && mode === 'create') {
      setFormData({
        name: '', category: '', price: '', gender: 'Unisex',
        stockBySize: tallasList.reduce((acc, size) => ({ ...acc, [size]: '' }), {})
      });
      setImages([]);
      setErrors({});
    }
  }, [isOpen, mode, productData]);

  if (!isOpen) return null;

  const isViewOnly = mode === 'view';
  const title = mode === 'create' ? 'Registrar Producto' : mode === 'edit' ? 'Editar Producto' : 'Detalle del Producto';
  const buttonText = mode === 'create' ? 'Crear Producto' : 'Guardar Cambios';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: false });
  };

  const handleStockChange = (size, value) => {
    setFormData({
      ...formData,
      stockBySize: { ...formData.stockBySize, [size]: value }
    });
  };

  // Subir imagen a Cloudinary
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 6) {
      alert('Máximo 6 imágenes por producto');
      return;
    }

    for (const file of files) {
      // Convertir a base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result;
        setUploadingCount(prev => prev + 1);

        try {
          const res = await fetch(`${API}/productos/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64 })
          });

          const data = await res.json();
          if (res.ok && data.url) {
            setImages(prev => {
              const newImages = [...prev, { url: data.url, esPrincipal: prev.length === 0 }];
              return newImages;
            });
          } else {
            alert('Error al subir imagen: ' + (data.error || 'Error desconocido'));
          }
        } catch (error) {
          console.error('Error al subir imagen:', error);
          alert('Error al subir imagen');
        } finally {
          setUploadingCount(prev => prev - 1);
        }
      };
      reader.readAsDataURL(file);
    }

    // Reset input
    e.target.value = '';
    if (errors.images) setErrors({ ...errors, images: false });
  };

  const handleSetPrincipal = (index) => {
    if (isViewOnly) return;
    setImages(prev => prev.map((img, i) => ({ ...img, esPrincipal: i === index })));
  };

  const handleRemoveImage = (index) => {
    if (isViewOnly) return;
    setImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      // Si eliminamos la principal, hacer la primera la nueva principal
      if (newImages.length > 0 && !newImages.some(i => i.esPrincipal)) {
        newImages[0].esPrincipal = true;
      }
      return newImages;
    });
  };

  const handleSubmit = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = true;
    if (!formData.category.trim()) newErrors.category = true;
    if (formData.price === '' || formData.price <= 0) newErrors.price = true;
    if (images.length === 0) newErrors.images = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const dataToSave = {
      id: productData ? productData.id : null,
      name: formData.name,
      category: formData.category,
      price: Number(formData.price),
      gender: formData.gender,
      stockBySize: formData.stockBySize,
      stock: Object.values(formData.stockBySize).reduce((sum, val) => sum + (Number(val) || 0), 0),
      images: images.map(img => ({ url: img.url, esPrincipal: img.esPrincipal })),
      isActive: productData ? productData.isActive : true
    };

    onSave(dataToSave);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container modal-medium">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="btn-close" onClick={onClose} title="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            
            {/* NOMBRE */}
            <div className="input-group full-width">
              <label>Nombre del Producto {!isViewOnly && <span className="required-asterisk">*</span>}</label>
              <input 
                type="text" name="name" value={formData.name} onChange={handleChange}
                disabled={isViewOnly} placeholder="Ej: Tenis Nike Air Force 1"
                className={errors.name ? 'input-error' : ''}
              />
              {errors.name && <span className="error-text">El nombre es obligatorio.</span>}
            </div>

            {/* CATEGORÍA, PRECIO, GÉNERO */}
            <div className="form-row form-row-3">
              <div className="input-group">
                <label>Categoría {!isViewOnly && <span className="required-asterisk">*</span>}</label>
                <select name="category" value={formData.category} onChange={handleChange}
                  disabled={isViewOnly} className={errors.category ? 'input-error' : ''}>
                  <option value="">Seleccione...</option>
                  {categoriasDB.map(cat => (
                    <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                  ))}
                </select>
                {errors.category && <span className="error-text">Seleccione una categoría.</span>}
              </div>

              <div className="input-group">
                <label>Precio (COP) {!isViewOnly && <span className="required-asterisk">*</span>}</label>
                <input type="number" name="price" value={formData.price} onChange={handleChange}
                  disabled={isViewOnly} placeholder="Ej: 250000" min="0"
                  className={errors.price ? 'input-error' : ''}
                />
                {errors.price && <span className="error-text">Ingrese un precio válido.</span>}
              </div>

              <div className="input-group">
                <label>Género</label>
                <select name="gender" value={formData.gender} onChange={handleChange} disabled={isViewOnly}>
                  {generosList.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            {/* IMÁGENES */}
            <div className="input-group full-width">
              <label>
                Imágenes del Producto {!isViewOnly && <span className="required-asterisk">*</span>}
                <span style={{ fontSize: '11px', marginLeft: '8px', color: '#71717a' }}>
                  Máx. 6 imágenes. Click en ★ para imagen principal
                </span>
              </label>
              
              <div className={`images-gallery ${errors.images ? 'images-error' : ''}`}>
                {images.map((img, index) => (
                  <div key={index} className={`image-preview-item ${img.esPrincipal ? 'is-principal' : ''}`}>
                    <img src={img.url} alt={`Producto ${index + 1}`} />
                    {!isViewOnly && (
                      <div className="image-actions">
                        <button 
                          className={`btn-star ${img.esPrincipal ? 'active' : ''}`} 
                          onClick={() => handleSetPrincipal(index)} title="Imagen principal"
                        >
                          <Star size={14} fill={img.esPrincipal ? '#C9A24D' : 'none'} />
                        </button>
                        <button className="btn-remove-img" onClick={() => handleRemoveImage(index)} title="Eliminar">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                    {img.esPrincipal && <span className="principal-badge">Principal</span>}
                  </div>
                ))}

                {!isViewOnly && images.length < 6 && (
                  <label className="image-upload-btn">
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
                    {uploadingCount > 0 ? (
                      <span className="uploading-text">Subiendo...</span>
                    ) : (
                      <>
                        <Upload size={24} />
                        <span>Subir Imagen</span>
                      </>
                    )}
                  </label>
                )}
              </div>
              {errors.images && <span className="error-text">Debes subir al menos una imagen.</span>}
            </div>

            {/* STOCK POR TALLAS */}
            <div className="input-group full-width">
              <label>Inventario por Talla (US) <span style={{ fontSize: '11px', marginLeft: '5px', color: '#71717a' }}>Dejar en blanco si no hay stock</span></label>
              <div className="sizes-stock-container">
                {tallasList.map((size) => (
                  <div key={size} className="size-input-wrapper">
                    <span className="size-badge">{size}</span>
                    <input 
                      type="number" min="0" value={formData.stockBySize[size] || ''}
                      onChange={(e) => handleStockChange(size, e.target.value)}
                      disabled={isViewOnly} className="size-amount-input" placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {!isViewOnly && (
          <div className="modal-footer">
            <button className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button className="btn-primary-modal" onClick={handleSubmit} disabled={uploadingCount > 0}>
              {uploadingCount > 0 ? 'Subiendo imágenes...' : buttonText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};