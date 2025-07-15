import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPages";
import RegisterPage from "./pages/RegisterPages";
import ProductListPage from "./pages/ProductListPage";
import AdminDashboard from "./pages/AdminDashboard";
import Navbar from "./components/Navbar";
import AdminProductManager from "./pages/admin/products/AdminProductManager";
import CartPage from "./pages/CartPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import MyOrders from "./pages/Myorders";
import AdminOrderPage from "./pages/AdminOrderPage";
import NewProductPage from "./pages/admin/products/RegisterProductPage";
import EditProductPage from "./pages/admin/products/EditProductPage";
import PrivateRoute from "./routes/PrivateRoutes";
import NotFoundPage from "./pages/NotFoundPage";
import AdminInboxPage from "./pages/AdminInboxPage";
import SupportChatPage from "./pages/SupportChatPage";
import AdminCategoryPage from "./pages/admin/products/AdminCategoryPage";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<ProductListPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* Privadas para usuarios */}
        <Route element={<PrivateRoute allowedRoles={["user"]} />}>
          <Route path="/cart" element={<CartPage />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
        </Route>
        {/* Privadas para administrador */}
        <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/orders" element={<AdminOrderPage />} />
          <Route path="/admin/products" element={<AdminProductManager />} />
          <Route path="/admin/products/new" element={<NewProductPage />} />
          <Route path="/admin/categories" element={<AdminCategoryPage />} />
          <Route
            path="/admin/products/edit/:id"
            element={<EditProductPage />}
          />
          <Route path="/support/:withUserId" element={<SupportChatPage />} />
          <Route path="/admin/inbox" element={<AdminInboxPage />} />
        </Route>
        {/* Ruta compartida para soporte (usuarios y administradores) */}
        <Route element={<PrivateRoute allowedRoles={["user", "admin"]} />}>
          <Route path="/support" element={<SupportChatPage />} />
        </Route>
        {/* tus otras rutas... */}
        <Route path="*" element={<NotFoundPage />} /> {/* 👈 ruta comodín */}
      </Routes>
    </Router>
  );
}

export default App;
