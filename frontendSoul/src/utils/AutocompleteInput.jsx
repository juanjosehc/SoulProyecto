import { useState, useEffect, useRef } from 'react';

/**
 * Buscador dinámico (autocomplete) reutilizable
 * Props:
 *  - value: valor actual (string)
 *  - onChange: callback(value)
 *  - fetchUrl: URL base para buscar (se agrega ?q=...)
 *  - placeholder: texto placeholder
 *  - disabled: boolean
 *  - className: clase CSS extra
 *  - displayKey: key del objeto a mostrar (default 'name')
 *  - onSelect: callback(item) cuando se selecciona un item
 */
export const AutocompleteInput = ({ value, onChange, fetchUrl, placeholder, disabled, className, displayKey = 'name', onSelect }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  // Búsqueda con debounce
  const handleInputChange = (e) => {
    const val = e.target.value;
    onChange(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.trim().length >= 1) {
      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${fetchUrl}?q=${encodeURIComponent(val)}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });
          const data = await res.json();
          if (Array.isArray(data)) {
            setSuggestions(data);
            setShowDropdown(true);
          }
        } catch (err) {
          console.error('Error en autocomplete:', err);
        } finally {
          setLoading(false);
        }
      }, 250);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  };

  const handleSelect = (item) => {
    onChange(item[displayKey]);
    setShowDropdown(false);
    if (onSelect) onSelect(item);
  };

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cargar sugerencias al hacer focus si hay texto
  const handleFocus = async () => {
    if (value && value.trim().length >= 1) {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch(`${fetchUrl}?q=${encodeURIComponent(value)}`, { headers });
        const data = await res.json();
        if (Array.isArray(data)) {
          setSuggestions(data);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error('Error en autocomplete focus:', err);
      } finally {
        setLoading(false);
      }
    } else {
      // Cargar todos si no hay texto
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch(`${fetchUrl}?q=`, { headers });
        const data = await res.json();
        if (Array.isArray(data)) {
          setSuggestions(data);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error('Error en autocomplete:', err);
      }
    }
  };

  return (
    <div className="autocomplete-wrapper" ref={wrapperRef}>
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={placeholder || 'Buscar...'}
        disabled={disabled}
        className={className || ''}
        autoComplete="off"
      />
      {showDropdown && suggestions.length > 0 && (
        <div className="autocomplete-dropdown">
          {suggestions.map((item, i) => (
            <div key={item.id || i} className="autocomplete-option" onClick={() => handleSelect(item)}>
              {item[displayKey]}
              {item.price && <span className="autocomplete-price">${Number(item.price).toLocaleString('es-CO')}</span>}
            </div>
          ))}
        </div>
      )}
      {showDropdown && suggestions.length === 0 && !loading && (
        <div className="autocomplete-dropdown">
          <div className="autocomplete-empty">Sin resultados</div>
        </div>
      )}
    </div>
  );
};
