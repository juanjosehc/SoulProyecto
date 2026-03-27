import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

const API = 'http://localhost:3000/api';

export const LowStockAlert = () => {
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API}/dashboard/low-stock`);
        const data = await res.json();
        setProductos(data);
      } catch (error) {
        console.error('Error al cargar stock bajo:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="low-stock-card">
      <div className="low-stock-header">
        <AlertTriangle size={24} className="alert-icon" />
        <div className="alert-titles">
          <h3>Productos con stock bajo</h3>
          <p>Los siguientes productos tienen menos de 10 unidades en stock</p>
        </div>
      </div>

      <div className="low-stock-list">
        {productos.length > 0 ? (
          productos.map((producto) => (
            <div key={producto.id} className="low-stock-item">
              <span className="product-name">{producto.nombre}</span>
              <span className="product-stock">{producto.stock} un.</span>
            </div>
          ))
        ) : (
          <div className="low-stock-item" style={{ color: '#71717a', fontStyle: 'italic' }}>
            <span>Todos los productos tienen stock suficiente</span>
          </div>
        )}
      </div>
    </div>
  );
};