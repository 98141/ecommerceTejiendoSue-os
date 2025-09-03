import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import GlobalHttpHandler from "./components/GlobalHttpHandler";

/* Páginas públicas */
import ProductListPage from "./pages/ProductListPage";
import LoginPage from "./pages/LoginPages";
import RegisterPage from "./pages/RegisterPages";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import CatalogoPage from "./pages/user/CatalogoPage";
import OrigenNarinoPage from "./pages/user/cafe/OrigenNariñoPage";
import { PanelaSandonaPage } from "./pages/user/panela/PanelaSandonaPage";
import PanelaRecipesPage from "./pages/user/panela/RecetasPanelaPage";
import TostionCafePage from "./pages/user/cafe/TostionCafePage";
import ProfilePage from "./pages/ProfilePage";

/* Páginas privadas (user) */
import PrivateRoute from "./routes/PrivateRoutes";
import CartPage from "./pages/CartPage";
import MyOrders from "./pages/Myorders";
import ProductDetailPage from "./pages/ProductDetailPage";
import FavoritesPage from "./pages/user/FavoritesPage";

/* Páginas privadas (admin) */
import AdminDashboard from "./pages/AdminDashboard";
import AdminOrderPage from "./pages/AdminOrderPage";
import AdminOrderDetailPage from "./pages/admin/products/AdminOrderDetailPage";
import AdminProductManager from "./pages/admin/products/AdminProductManager";
import NewProductPage from "./pages/admin/products/RegisterProductPage";
import EditProductPage from "./pages/admin/products/EditProductPage";
import AdminCategoryPage from "./pages/admin/products/AdminCategoryPage";
import AdminSizesPage from "./pages/admin/products/AdminSizesPage";
import AdminColorsPage from "./pages/admin/products/AdminColorsPages";
import AdminDashboarPage from "./pages/admin/AdminDashboardPage";
import ProductHistoryPage from "./pages/admin/products/AdminProductHistoryPage";
import AdminProductEntryHistoryPage from "./pages/admin/products/AdminProductEntryHistoyPage";
import AdminInboxPage from "./pages/AdminInboxPage";
import RequireAdmin from "./components/RequireAdmin";
import UsersAdminPage from "./pages/admin/UsersAdminPage";

/* Soporte y varias */
import SupportChatPage from "./pages/SupportChatPage";
import NotFoundPage from "./pages/NotFoundPage";
import SlowPage from "./routes/SlowPage";

function AppShell() {
  return (
    <>
      <header className="site-header">
        <Navbar />
      </header>

      {/* Overlay + watchdog + cancelación de requests */}
      {/* Activa overlay también en cambios de ruta con showOnRouteChange={true} si lo deseas */}
      <GlobalHttpHandler
        showOnRouteChange={true}
        routeMinMs={300}
        routeMaxMs={1200}
      />

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
          <Route path="/profile" element={<ProfilePage />} />
          {/** Complementos de navbar de cafe y panela */}
          <Route path="/origen/cafe-narino" element={<OrigenNarinoPage />} />
          <Route path="/origen/tostion" element={<TostionCafePage />} />
          <Route
            path="/origen/panela-sandona"
            element={<PanelaSandonaPage />}
          />
          <Route path="/origen/recetas" element={<PanelaRecipesPage />} />

          <Route path="/tienda" element={<CatalogoPage />} />
          <Route path="/categoria/:slug" element={<CatalogoPage />} />
          {/* Compatibilidad navbar actual */}
          <Route path="/artesanias/:slug" element={<CatalogoPage />} />
          <Route path="/cafe/:slug" element={<CatalogoPage />} />
          <Route path="/panela/:slug" element={<CatalogoPage />} />

          {/* Estado de carga lenta */}
          <Route path="/status/slow" element={<SlowPage />} />

          {/* Privadas usuario */}
          <Route element={<PrivateRoute allowedRoles={["user"]} />}>
            <Route path="/cart" element={<CartPage />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
          </Route>

          {/* Privadas admin */}
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
            <Route path="/support/:withUserId" element={<SupportChatPage />} />
            <Route path="/admin/inbox" element={<AdminInboxPage />} />
            <Route path="/admin/categories" element={<AdminCategoryPage />} />
            <Route path="/admin/sizes" element={<AdminSizesPage />} />
            <Route path="/admin/colors" element={<AdminColorsPage />} />
            <Route
              path="/admin/historial"
              element={<AdminProductEntryHistoryPage />}
            />
            <Route
              path="/admin/users"
              element={
                <RequireAdmin>
                  <UsersAdminPage />
                </RequireAdmin>
              }
            />
          </Route>

          {/* Soporte compartido */}
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

      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default function App() {
  return (
    <Router>
      <div className="app-shell">
        <AppShell />
      </div>
    </Router>
  );
}
