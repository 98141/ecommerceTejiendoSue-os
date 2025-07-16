import { useContext } from "react";
import { CartContext } from "../contexts/CartContext";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CartItem from "../blocks/users/CartItem";

const CartPage = () => {
  const { cart, updateItem, removeFromCart, clearCart } =
    useContext(CartContext);
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const total = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handleCheckout = async () => {
    if (!token) {
      alert("Debes iniciar sesión para realizar el pedido.");
      return navigate("/login");
    }

    const items = cart.map((item) => ({
      product: item.product._id,
      size: item.size._id,
      color: item.color._id,
      quantity: item.quantity,
    }));

    try {
      await axios.post(
        "http://localhost:5000/api/orders",
        { items, total },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Pedido realizado exitosamente");
      clearCart();
      navigate("/my-orders");
    } catch (err) {
      alert(
        "Error al realizar el pedido: " +
          (err.response?.data?.error || "Intenta más tarde.")
      );
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
        Carrito de Compras
      </h2>

      {cart.length === 0 ? (
        <p style={{ textAlign: "center" }}>Tu carrito está vacío.</p>
      ) : (
        <>
          {cart.map((item) => (
            <CartItem
              key={`${item.product._id}-${item.size}-${item.color}`}
              item={item}
              updateItem={updateItem}
              removeFromCart={removeFromCart}
            />
          ))}

          <h3 style={{ textAlign: "right", marginTop: "20px" }}>
            Total a pagar: <span style={{ color: "#2d89e5" }}>${total}</span>
          </h3>

          <div style={{ textAlign: "right", marginTop: "10px" }}>
            <button
              onClick={handleCheckout}
              style={{
                backgroundColor: "#2d89e5",
                color: "white",
                border: "none",
                padding: "10px 16px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Finalizar compra
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CartPage;
