const OrderCardBlock = ({ order, onStatusChange }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "pendiente": return "orange";
      case "enviado": return "blue";
      case "entregado": return "green";
      default: return "gray";
    }
  };

  return (
    <div className="order-card" style={{
      border: "1px solid #ccc", padding: "15px", marginBottom: "20px", borderRadius: "8px"
    }}>
      <p><strong>Nombre de usuario:</strong> {order.user?.name || "N/A"}</p>
      <p><strong>Usuario:</strong> {order.user?.email || "N/A"}</p>
      <p><strong>Fecha:</strong> {new Date(order.createdAt).toLocaleString()}</p>
      <p><strong>Total:</strong> ${order.total}</p>

      <label>
        <strong>Estado:</strong>{" "}
        <select
          value={order.status}
          onChange={(e) => onStatusChange(order._id, e.target.value)}
          style={{ color: getStatusColor(order.status) }}
        >
          <option value="pendiente">pendiente</option>
          <option value="enviado">enviado</option>
          <option value="entregado">entregado</option>
        </select>
      </label>

      <ul style={{ marginTop: "20px" }}>
        {order.items.map((item, i) => (
          <li key={i}>
            {item.product ? (
              <>
                {item.quantity} x {item.product.name} (${item.product.price} c/u)
                {item.size && ` | Talla: ${item.size.label}`}
                {item.color && ` | Color: ${item.color.name}`}
              </>
            ) : (
              <em>Producto eliminado</em>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OrderCardBlock;
