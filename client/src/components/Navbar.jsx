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
  const location = useLocation();

  const [showConfirm, setShowConfirm] = useState(false);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogoutConfirm = async () => {
    await logout();
    showToast("Sesión cerrada correctamente", "success");
    navigate("/");
  };

  const linkClass = (path) =>
    `nav-link ${location.pathname === path ? "active" : ""}`;

  const capitalizeInitials = (name) => {
  if (!name) return "";
  return name
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

  return (
    <>
      <nav className="navbar-container">
        <div className="nav-left">
          <Link to="/" className={linkClass("/")}>Inicio</Link>

          {user?.role === "admin" && (
            <>
              <Link to="/admin/dashboard" className={linkClass("/admin/dashboard")}>Dashboard</Link>
              <Link to="/admin" className={linkClass("/admin")}>Pedidos</Link>
              <Link to="/admin/orders" className={linkClass("/admin/orders")}>Historial</Link>
              <Link to="/admin/products" className={linkClass("/admin/products")}>Productos</Link>
            </>
          )}

          {user?.role === "user" && (
            <>
              <Link to="/cart" className={linkClass("/cart")}>Carrito ({totalItems})</Link>
              <Link to="/my-orders" className={linkClass("/my-orders")}>Mis pedidos</Link>
            </>
          )}

          {user && (
            <Link
              to={user.role === "admin" ? "/admin/inbox" : "/support"}
              className={`nav-link relative ${
                linkClass(user.role === "admin" ? "/admin/inbox" : "/support")
              }`}
            >
              Soporte
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </Link>
          )}
        </div>

        <div className="nav-right">
          {user ? (
            <>
              <span className="nav-user">Hola, {capitalizeInitials(user.name)}</span>
              <button onClick={() => setShowConfirm(true)} className="logout-button">
                Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={linkClass("/login")}>Login</Link>
              <Link to="/register" className={linkClass("/register")}>Registro</Link>
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
