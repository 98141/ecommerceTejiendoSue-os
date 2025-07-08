import { Link, useNavigate } from "react-router-dom"; // 👈 agrega useNavigate
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { CartContext } from "../contexts/CartContext";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const navigate = useNavigate(); // 👈 inicializa useNavigate

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    if (confirm("¿Deseas cerrar sesión?")) {
      logout();              // Cierra sesión
      navigate("/");         // 👈 Redirige al inicio
    }
  };

  return (
    <nav className="bg-gray-800 text-white px-4 py-2 flex justify-between">
      <div>
        <Link to="/" className="mr-4">Inicio</Link>

        {isAdmin && (
          <>
            <Link to="/admin" className="mr-4">Pedidos</Link>
            <Link to="/admin/orders" className="mr-4">Historial</Link>
            <Link to="/admin/products" className="mr-4">Productos</Link>
          </>
        )}

        {user && !isAdmin && (
          <>
            <Link to="/cart" className="mr-4">Carrito ({totalItems})</Link>
            <Link to="/my-orders" className="mr-4">Mis pedidos</Link>
          </>
        )}
      </div>

      <div>
        {user ? (
          <>
            <span className="mr-2">Hola, {user.name}</span>
            <button onClick={handleLogout} className="text-red-300">
              Salir
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="mr-4">Login</Link>
            <Link to="/register">Registro</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
