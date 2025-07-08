import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './contexts/ToastContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>         {/* 👈 Debe envolver toda la app */}
      <CartProvider>
        <App />
      </CartProvider>
    </ToastProvider>
  </StrictMode>
);
