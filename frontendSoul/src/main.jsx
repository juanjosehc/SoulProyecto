import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Interceptor global: agrega automáticamente el token de autenticación a las peticiones al API
const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
  // Solo agregar token a las peticiones al backend de SOUL
  if (typeof url === 'string' && url.includes('localhost:3000/api')) {
    const token = localStorage.getItem('token');
    if (token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      };
    }
  }
  return originalFetch(url, options);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
