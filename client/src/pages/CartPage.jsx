// pages/CartPage.jsx
import { useContext, useMemo, useState } from "react";
import { CartContext } from "../contexts/CartContext";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CartItem from "../blocks/users/CartItem";
import CheckoutModal from "../blocks/users/CheckoutModal";

const ADMIN_WHATSAPP = "573147788069"; 

const CartPage = () => {
  const { cart, updateItem, removeFromCart, clearCart } =
    useContext(CartContext);
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const total = useMemo(
    () =>
      cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  );

  const toOrderItems = () =>
    cart.map((item) => ({
      product: item.product._id,
      size: item.size?._id,
      color: item.color?._id,
      quantity: item.quantity,
    }));

  const startCheckout = () => {
    if (!token) {
      alert("Debes iniciar sesión para realizar el pedido.");
      return navigate("/login");
    }
    if (cart.length === 0) {
      alert("Tu carrito está vacío.");
      return;
    }
    setOpenModal(true);
  };

  const buildWhatsAppText = (order, shippingInfo) => {
    const lines = [];
    lines.push("*Nuevo pedido*");
    lines.push(`ID: ${order._id}`);
    lines.push(`Cliente: ${user?.name || "N/A"} (${user?.email || ""})`);
    if (shippingInfo) {
      lines.push(
        `Envío: ${shippingInfo.fullName} | Tel: ${shippingInfo.phone}`
      );
      lines.push(`${shippingInfo.address}, ${shippingInfo.city}`);
      if (shippingInfo.notes) lines.push(`Notas: ${shippingInfo.notes}`);
    }
    lines.push("");
    lines.push("*Detalle:*");
    order.items.forEach((it) => {
      const name = it?.product?.name || "Producto";
      const size = it?.size?.label ? ` / Talla: ${it.size.label}` : "";
      const color = it?.color?.name ? ` / Color: ${it.color.name}` : "";
      lines.push(
        `- ${name}${size}${color} x${it.quantity} = $${(
          it.unitPrice * it.quantity
        ).toFixed(2)}`
      );
    });
    lines.push("");
    lines.push(`*Total:* $${Number(order.total).toFixed(2)}`);

    return encodeURIComponent(lines.join("\n"));
  };

  const confirmCheckout = async (shippingInfo) => {
    setLoading(true);
    try {
      const items = toOrderItems();

      // ⚠️ el backend calcula total y controla stock; aquí solo enviamos items+shippingInfo
      const { data } = await axios.post(
        "http://localhost:5000/api/orders",
        { items, shippingInfo },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Ideal: repoblar order (si tu endpoint no hace populate aquí, puedes reconsultar /api/orders/:id)
      const order = data.order;

      // Construir WhatsApp y abrir
      const text = buildWhatsAppText(order, shippingInfo);
      const waLink = `https://wa.me/${ADMIN_WHATSAPP}?text=${text}`;
      window.open(waLink, "_blank", "noopener,noreferrer");

      alert("Pedido realizado exitosamente");
      clearCart();
      navigate("/my-orders");
    } catch (err) {
      alert(
        "Error al realizar el pedido: " +
          (err.response?.data?.error || "Intenta más tarde.")
      );
    } finally {
      setLoading(false);
      setOpenModal(false);
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
              key={`${item.product._id}-${item.size?._id}-${item.color?._id}`}
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
              disabled={loading}
              onClick={startCheckout}
              style={{
                backgroundColor: "#2d89e5",
                color: "white",
                border: "none",
                padding: "10px 16px",
                borderRadius: "4px",
                cursor: "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Procesando..." : "Finalizar compra"}
            </button>
          </div>
        </>
      )}

      <CheckoutModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onConfirm={confirmCheckout}
      />
    </div>
  );
};

export default CartPage;
