import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPages";
import RegisterPage from "./pages/RegisterPages";
import ProductList from "./pages/ProductList";
import AdminDashboard from "./pages/AdminDashboard";
import Navbar from "./components/Navbar";
import AdminProductManager from "./pages/AdminProductManager";
import CartPage from "./pages/CartPage";
import ProductDetail from "./pages/ProductDetail";
import MyOrders from "./pages/Myorders";
import AdminOrderPage from "./pages/AdminOrderPage";
import NewProductPage from "./pages/RegisterProductPage";
import EditProductPage from "./pages/EditProductPage";
import PrivateRoute from "./routes/PrivateRoutes";
import NotFoundPage from "./pages/NotFoundPage";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Navbar />
          <Routes>
            {/* Públicas */}
            <Route path="/" element={<ProductList />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Privadas para usuarios */}
            <Route element={<PrivateRoute allowedRoles={["user"]} />}>
              <Route path="/cart" element={<CartPage />} />
              <Route path="/my-orders" element={<MyOrders />} />
              <Route path="/product/:id" element={<ProductDetail />} />
            </Route>

            {/* Privadas para administrador */}
            <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/orders" element={<AdminOrderPage />} />
              <Route path="/admin/products" element={<AdminProductManager />} />
              <Route path="/admin/products/new" element={<NewProductPage />} />
              <Route
                path="/admin/products/edit/:id"
                element={<EditProductPage />}
              />
              {/* tus otras rutas... */}
              <Route path="*" element={<NotFoundPage />} />{" "}
              {/* 👈 ruta comodín */}
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
