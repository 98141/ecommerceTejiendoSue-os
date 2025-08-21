import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../ConfirmModalBlock";
import { formatCOP } from "../../utils/currency";

const OrderCardBlock = ({ order, onStatusChange, onCancel }) => {
  const navigate = useNavigate();

  // Estado modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmMode, setConfirmMode] = useState(null); // "status" | "cancel"
  const [pendingStatus, setPendingStatus] = useState("");

  // Opciones válidas según estado actual
  const nextStatusOptions = useMemo(() => {
    switch (order.status) {
      case "pendiente":
        return ["enviado"];
      case "enviado":
        return ["entregado"];
      case "entregado":
      case "cancelado":
      default:
        return [];
    }
  }, [order.status]);

  const handleSelectChange = (e) => {
    const next = e.target.value;
    if (!next || next === order.status) return;

    setPendingStatus(next);
    setConfirmMode("status");
    setConfirmTitle("Confirmar cambio de estado");
    setConfirmMessage(
      next === "enviado"
        ? "¿Marcar el pedido como ENVIADO?"
        : "¿Marcar el pedido como ENTREGADO?"
    );
    setConfirmOpen(true);
  };

  const openCancelModal = () => {
    setConfirmMode("cancel");
    setConfirmTitle("Cancelar pedido");
    setConfirmMessage("¿Deseas cancelar este pedido? Se restablecerá el stock.");
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    try {
      if (confirmMode === "status") {
        await onStatusChange(order._id, pendingStatus);
      } else if (confirmMode === "cancel") {
        await onCancel(order._id);
      }
    } finally {
      setConfirmOpen(false);
      setConfirmMode(null);
      setPendingStatus("");
      setConfirmTitle("");
      setConfirmMessage("");
    }
  };

  const handleCancelModal = () => {
    setConfirmOpen(false);
    setConfirmMode(null);
    setPendingStatus("");
    setConfirmTitle("");
    setConfirmMessage("");
  };

  const badgeClass = `order-card__badge order-card__badge--${order.status}`;

  return (
    <div className="order-card">
      <div className="order-card__header">
        <h4 className="order-card__title">Pedido #{order._id}</h4>
        <span
          className={badgeClass}
          aria-label={`Estado: ${order.status}`}
          title={`Estado: ${order.status}`}
        >
          {order.status}
        </span>
      </div>

      <p className="order-card__meta">
        <strong>Nombre de usuario:</strong> {order.user?.name || "N/A"}
      </p>
      <p className="order-card__meta">
        <strong>Usuario:</strong> {order.user?.email || "N/A"}
      </p>
      <p className="order-card__meta">
        <strong>Fecha:</strong> {new Date(order.createdAt).toLocaleString()}
      </p>
      <p className="order-card__meta">
        <strong>Total:</strong> {formatCOP(order.total)}
      </p>

      <div className="order-card__status-block">
        <label htmlFor={`status-${order._id}`} className="order-card__label">
          Cambiar estado:
        </label>

        {nextStatusOptions.length > 0 ? (
          <select
            id={`status-${order._id}`}
            onChange={handleSelectChange}
            defaultValue=""
            className="order-card__select"
          >
            <option value="" disabled>
              Selecciona nuevo estado…
            </option>
            {nextStatusOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : (
          <em className="order-card__no-changes">No hay cambios disponibles</em>
        )}
      </div>

      {/* Tabla de ítems */}
      <div className="table-responsive order-card__table-wrap">
        <table className="table table-order-items">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Talla</th>
              <th>Color</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {(order.items || []).map((item, i) => {
              const price = item.product?.price ?? 0;
              const qty = Number(item.quantity) || 0;
              const subtotal = qty * Number(price);
              return (
                <tr key={item._id || i}>
                  <td>{item.product?.name || "Producto eliminado"}</td>
                  <td>{item.size?.label || "-"}</td>
                  <td>{item.color?.name || "-"}</td>
                  <td>{qty}</td>
                  <td>{formatCOP(price)}</td>
                  <td>{formatCOP(subtotal)}</td>
                </tr>
              );
            })}
            {(!order.items || order.items.length === 0) && (
              <tr>
                <td colSpan={6}>
                  <em>Sin ítems</em>
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td className="total-label" colSpan={5}>
                Total
              </td>
              <td className="total-value">{formatCOP(order.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="order-card__actions">
        {order.status === "pendiente" && (
          <button
            className="btn btn--danger"
            onClick={openCancelModal}
            title="Cancelar pedido (restaura stock)"
          >
            Cancelar pedido
          </button>
        )}
        <button
          className="btn btn--dark"
          onClick={() => navigate(`/admin/orders/${order._id}`)}
        >
          Ver detalle
        </button>
      </div>

      {confirmOpen && (
        <ConfirmModal
          title={confirmTitle}
          message={confirmMessage}
          onConfirm={handleConfirm}
          onCancel={handleCancelModal}
        />
      )}
    </div>
  );
};

export default OrderCardBlock;
