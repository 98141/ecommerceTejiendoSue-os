import { Link, useNavigate } from "react-router-dom";
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

  const [showConfirm, setShowConfirm] = useState(false);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogoutConfirm = () => {
    logout();
    showToast("Sesión cerrada correctamente", "success");
    navigate("/");
  };

  return (
    <>
      <nav className="bg-gray-800 text-white px-4 py-2 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link to="/" className="hover:text-yellow-300">
            Inicio
          </Link>

          {user?.role === "admin" && (
            <>
            <Link to="/admin/dashboard" className="hover:text-yellow-300">
                Dashboard
              </Link>
              <Link to="/admin" className="hover:text-yellow-300">
                Pedidos
              </Link>
              <Link to="/admin/orders" className="hover:text-yellow-300">
                Historial
              </Link>
              <Link to="/admin/products" className="hover:text-yellow-300">
                Productos
              </Link>
            </>
          )}

          {user?.role === "user" && (
            <>
              <Link to="/cart" className="hover:text-yellow-300">
                Carrito ({totalItems})
              </Link>
              <Link to="/my-orders" className="hover:text-yellow-300">
                Mis pedidos
              </Link>
            </>
          )}

          {user && (
            <Link
              to={user.role === "admin" ? "/admin/inbox" : "/support"}
              className="relative hover:text-yellow-300"
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
              <Link to="/login" className="mr-4 hover:text-yellow-300">
                Login
              </Link>
              <Link to="/register" className="hover:text-yellow-300">
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
