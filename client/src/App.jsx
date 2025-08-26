import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
import AdminSizesPage from "./pages/admin/products/AdminSizesPage";
import AdminColorsPage from "./pages/admin/products/AdminColorsPages";
import AdminOrderDetailPage from "./pages/admin/products/AdminOrderDetailPage";
import AdminDashboarPage from "./pages/admin/AdminDashboardPage";
import Footer from "./components/Footer";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProductHistoryPage from "./pages/admin/products/AdminProductHistoryPage";
import AdminProductEntryHistoryPage from "./pages/admin/products/AdminProductEntryHistoyPage";
import CatalogoPage from "./pages/user/CatalogoPage";

function App() {
  return (
    <Router>
      <div className="app-shell">
        <header className="site-header">
          <Navbar />
        </header>

        <main className="site-main" role="main">
          <Routes>
            {/* Públicas */}
            <Route path="/" element={<ProductListPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/verify-email/:token"
              element={<EmailVerificationPage />}
            />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route
              path="/reset-password/:token"
              element={<ResetPasswordPage />}
            />
            <Route path="/tienda" element={<CatalogoPage />} />
            <Route path="/categoria/:slug" element={<CatalogoPage />} />

            {/* Compatibilidad con el navbar actual */}
            <Route path="/artesanias/:slug" element={<CatalogoPage />} />
            <Route path="/cafe/:slug" element={<CatalogoPage />} />
            <Route path="/panela/:slug" element={<CatalogoPage />} />

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
              <Route
                path="/admin/orders/:id"
                element={<AdminOrderDetailPage />}
              />
              <Route path="/admin/products" element={<AdminProductManager />} />
              <Route
                path="/admin/products/:id/history"
                element={<ProductHistoryPage />}
              />
              <Route path="/admin/products/new" element={<NewProductPage />} />
              <Route path="/admin/dashboard" element={<AdminDashboarPage />} />
              <Route
                path="/admin/products/edit/:id"
                element={<EditProductPage />}
              />
              <Route
                path="/support/:withUserId"
                element={<SupportChatPage />}
              />
              <Route path="/admin/inbox" element={<AdminInboxPage />} />
              <Route path="/admin/categories" element={<AdminCategoryPage />} />
              <Route path="/admin/sizes" element={<AdminSizesPage />} />
              <Route path="/admin/colors" element={<AdminColorsPage />} />
              <Route
                path="/admin/historial"
                element={<AdminProductEntryHistoryPage />}
              />
            </Route>

            {/* Ruta compartida para soporte */}
            <Route element={<PrivateRoute allowedRoles={["user", "admin"]} />}>
              <Route path="/support" element={<SupportChatPage />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        <footer className="site-footer">
          <Footer />
        </footer>

        {/* Toasts (posición fija; no afecta el layout) */}
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </Router>
  );
}

export default App;
