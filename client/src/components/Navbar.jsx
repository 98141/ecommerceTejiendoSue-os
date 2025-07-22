import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { CartContext } from "../contexts/CartContext";
import { SupportContext } from "../contexts/SupportContext";
import { useToast } from "../contexts/ToastContext";
import ConfirmModal from "../blocks/ConfirmModalBlock";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const { unreadCount } = useContext(SupportContext);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation(); // 👈 ubicación actual

  const [showConfirm, setShowConfirm] = useState(false);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogoutConfirm = async () => {
    await logout();
    showToast("Sesión cerrada correctamente", "success");
    navigate("/");
  };

  // 🔧 Función auxiliar para clase activa
  const linkClass = (path) =>
    `hover:text-yellow-300 ${
      location.pathname === path
        ? "text-yellow-400 font-semibold underline"
        : ""
    }`;

  return (
    <>
      <nav className="bg-gray-800 text-white px-4 py-2 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link to="/" className={linkClass("/")}>
            Inicio
          </Link>

          {user?.role === "admin" && (
            <>
              <Link
                to="/admin/dashboard"
                className={linkClass("/admin/dashboard")}
              >
                Dashboard
              </Link>
              <Link to="/admin" className={linkClass("/admin")}>
                Pedidos
              </Link>
              <Link to="/admin/orders" className={linkClass("/admin/orders")}>
                Historial
              </Link>
              <Link
                to="/admin/products"
                className={linkClass("/admin/products")}
              >
                Productos
              </Link>
            </>
          )}

          {user?.role === "user" && (
            <>
              <Link to="/cart" className={linkClass("/cart")}>
                Carrito ({totalItems})
              </Link>
              <Link to="/my-orders" className={linkClass("/my-orders")}>
                Mis pedidos
              </Link>
            </>
          )}

          {user && (
            <Link
              to={user.role === "admin" ? "/admin/inbox" : "/support"}
              className={`relative ${linkClass(
                user.role === "admin" ? "/admin/inbox" : "/support"
              )}`}
            >
              Soporte
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-5 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Link>
          )}
        </div>

        <div>
          {user ? (
            <>
              <span className="mr-2">Hola, {user.name}</span>
              <button
                onClick={() => setShowConfirm(true)}
                className="text-red-300 hover:underline"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={linkClass("/login") + " mr-4"}>
                Login
              </Link>
              <Link to="/register" className={linkClass("/register")}>
                Registro
              </Link>
            </>
          )}
        </div>
      </nav>

      {showConfirm && (
        <ConfirmModal
          title="Cerrar sesión"
          message="¿Deseas cerrar sesión?"
          onConfirm={() => {
            setShowConfirm(false);
            handleLogoutConfirm();
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
};

export default Navbar;
