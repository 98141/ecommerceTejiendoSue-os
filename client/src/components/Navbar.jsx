import { Link, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { CartContext } from "../contexts/CartContext";
import { useToast } from "../contexts/ToastContext";
import ConfirmModal from "../blocks/ConfirmModal"; // ✅

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [showConfirm, setShowConfirm] = useState(false); // ✅ modal de confirmación

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogoutConfirm = () => {
    logout();
    showToast("Sesión cerrada correctamente", "success");
    navigate("/");
  };

  return (
    <>
      <nav className="bg-gray-800 text-white px-4 py-2 flex justify-between">
        <div>
          <Link to="/" className="mr-4">
            Inicio
          </Link>

          {user?.role === "admin" && (
            <>
              <Link to="/admin" className="mr-4">
                Pedidos
              </Link>
              <Link to="/admin/orders" className="mr-4">
                Historial
              </Link>
              <Link to="/admin/products" className="mr-4">
                Productos
              </Link>
            </>
          )}

          {user?.role === "user" && (
            <>
              <Link to="/cart" className="mr-4">
                Carrito ({totalItems})
              </Link>
              <Link to="/my-orders" className="mr-4">
                Mis pedidos
              </Link>
            </>
          )}
        </div>

        <div>
          {user ? (
            <>
              <span className="mr-2">Hola, {user.name}</span>
              <button
                onClick={() => setShowConfirm(true)}
                className="text-red-300"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="mr-4">
                Login
              </Link>
              <Link to="/register">Registro</Link>
            </>
          )}
        </div>
      </nav>

      {/* Modal de confirmación */}
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
