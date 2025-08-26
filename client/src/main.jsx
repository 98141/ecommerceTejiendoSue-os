import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";

import App from "./App.jsx";

import { CartProvider } from "./contexts/CartContext";
import { ToastProvider } from "./contexts/ToastContext";
import { AuthProvider } from "./contexts/AuthContext";
import { SupportProvider } from "./contexts/SupportContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <SupportProvider>
            <App />
          </SupportProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  </StrictMode>
);