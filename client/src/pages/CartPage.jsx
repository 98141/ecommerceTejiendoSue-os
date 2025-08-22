import { useContext, useMemo, useState } from "react";
import { CartContext } from "../contexts/CartContext";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import CartItem from "../blocks/users/CartItem";
import CheckoutModal from "../blocks/users/CheckoutModal";
import { useToast } from "../contexts/ToastContext";

const ADMIN_WHATSAPP = "573147788069";

/** Formatea a COP sin decimales */
const fmtCOP = (n) =>
  Number(n || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

/** Devuelve el precio unitario que se debe cobrar (effectivePrice o price) */
const unitPrice = (product) =>
  typeof product?.effectivePrice !== "undefined"
    ? Number(product.effectivePrice)
    : Number(product?.price || 0);

const CartPage = () => {
  const { cart, updateItem, removeFromCart, clearCart } = useContext(CartContext);
  const { token, user } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);

  /** Subtotal (sumatoria líneas) */
  const subtotal = useMemo(
    () => cart.reduce((sum, it) => sum + unitPrice(it.product) * it.quantity, 0),
    [cart]
  );

  /** En un futuro aquí podrías calcular envío, impuestos, cupones, etc. */
  const shipping = 0;
  const taxes = 0;
  const total = subtotal + shipping + taxes;

  const toOrderItems = () =>
    cart.map((item) => ({
      product: item.product._id,
      size: item.size?._id,
      color: item.color?._id,
      quantity: item.quantity,
    }));

  const startCheckout = () => {
    if (!token) {
      showToast("Debes iniciar sesión para realizar el pedido.", "warning");
      return navigate("/login");
    }
    if (cart.length === 0) {
      showToast("Tu carrito está vacío.", "info");
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
      lines.push(`Envío: ${shippingInfo.fullName} | Tel: ${shippingInfo.phone}`);
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
        `- ${name}${size}${color} x${it.quantity} = ${fmtCOP(
          it.unitPrice * it.quantity
        )}`
      );
    });
    lines.push("");
    lines.push(`*Total:* ${fmtCOP(order.total)}`);
    return encodeURIComponent(lines.join("\n"));
  };

  const confirmCheckout = async (shippingInfo) => {
    setLoading(true);
    try {
      const items = toOrderItems();

      // ⚠️ El backend calcula total y controla stock; aquí sólo enviamos items + shippingInfo
      const { data } = await axios.post(
        "http://localhost:5000/api/orders",
        { items, shippingInfo },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const order = data.order;
      const text = buildWhatsAppText(order, shippingInfo);
      const waLink = `https://wa.me/${ADMIN_WHATSAPP}?text=${text}`;
      window.open(waLink, "_blank", "noopener,noreferrer");

      showToast("Pedido realizado exitosamente", "success");
      clearCart();
      navigate("/my-orders");
    } catch (err) {
      showToast(
        "Error al realizar el pedido: " +
          (err.response?.data?.error || "Intenta más tarde."),
        "error"
      );
    } finally {
      setLoading(false);
      setOpenModal(false);
    }
  };

  return (
    <div className="cart">
      <h1 className="cart__title">Carrito de Compras</h1>

      {cart.length === 0 ? (
        <div className="cart__empty">
          <div className="cart__bag" aria-hidden />
          <h3>Tu carrito está vacío</h3>
          <p>Explora nuestras artesanías y encuentra tu próximo favorito.</p>
          <Link to="/artesanias" className="btn btn--primary">
            Ver productos
          </Link>
        </div>
      ) : (
        <div className="cart__grid">
          {/* Lista de ítems */}
          <section className="cart__list" aria-label="Productos en el carrito">
            {cart.map((item) => (
              <div
                key={`${item.product._id}-${item.size?._id}-${item.color?._id}`}
                className="cart__row"
              >
                {/* CartItem: tu componente existente */}
                <CartItem
                  item={item}
                  updateItem={updateItem}
                  removeFromCart={removeFromCart}
                />

                {/* Línea de totales por ítem (seguro, aunque CartItem ya muestre) */}
                <div className="cart__line">
                  <span>
                    {fmtCOP(unitPrice(item.product))} × {item.quantity}
                  </span>
                  <b>{fmtCOP(unitPrice(item.product) * item.quantity)}</b>
                </div>
              </div>
            ))}

            <div className="cart__actions">
              <Link to="/artesanias" className="btn btn--ghost">
                ← Seguir comprando
              </Link>
              <button
                className="btn btn--danger"
                onClick={() => {
                  if (confirm("¿Vaciar el carrito?")) clearCart();
                }}
              >
                Vaciar carrito
              </button>
            </div>
          </section>

          {/* Resumen / Checkout */}
          <aside className="cart__summary" aria-label="Resumen de compra">
            <div className="sum__box">
              <h3>Resumen</h3>

              <div className="sum__row">
                <span>Subtotal</span>
                <span>{fmtCOP(subtotal)}</span>
              </div>
              <div className="sum__row">
                <span>Envío</span>
                <span>{shipping === 0 ? "Gratis" : fmtCOP(shipping)}</span>
              </div>
              <div className="sum__row">
                <span>Impuestos</span>
                <span>{taxes === 0 ? "-" : fmtCOP(taxes)}</span>
              </div>

              <hr className="sum__rule" />

              <div className="sum__row sum__row--total">
                <span>Total a pagar</span>
                <b>{fmtCOP(total)}</b>
              </div>

              <button
                className="btn btn--primary sum__checkout"
                disabled={loading}
                onClick={startCheckout}
              >
                {loading ? "Procesando..." : "Finalizar compra"}
              </button>

              <p className="sum__hint">
                Pagas de forma segura. Al confirmar, podrás coordinar el envío por
                WhatsApp con nuestro equipo.
              </p>
            </div>
          </aside>
        </div>
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
