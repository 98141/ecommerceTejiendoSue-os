import { useContext } from "react";
import { CartContext } from "../contexts/CartContext";
import { AuthContext } from "../contexts/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CartPage = () => {
  const { cart, removeFromCart, clearCart } = useContext(CartContext);
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (!token) {
      alert("Debes iniciar sesión para realizar el pedido.");
      return navigate("/login");
    }

    const items = cart.map(item => ({
      product: item.product._id,
      quantity: item.quantity
    }));

    try {
      await axios.post("http://localhost:5000/api/orders", { items, total }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Pedido realizado exitosamente");
      clearCart();
      navigate("/my-orders");
    } catch (err) {
      alert("Error al realizar el pedido: " + err.response?.data?.error);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Carrito</h2>
      {cart.length === 0 ? (
        <p>Tu carrito está vacío.</p>
      ) : (
        <>
          {cart.map(item => (
            <div key={item.product._id} style={{ borderBottom: "1px solid gray", marginBottom: 10 }}>
              <p>{item.product.name} - {item.quantity} x ${item.product.price}</p>
              <button onClick={() => removeFromCart(item.product._id)}>Eliminar</button>
            </div>
          ))}
          <p><strong>Total:</strong> ${total}</p>
          <button onClick={handleCheckout}>Finalizar compra</button>
        </>
      )}
    </div>
  );
};

export default CartPage;
