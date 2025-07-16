import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import axios from "axios";

const MyOrdersPage = () => {
  const { token } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!token) return;

    axios.get("http://localhost:5000/api/orders/my", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setOrders(res.data));
  }, [token]);

  const getStatusColor = (status) => {
    switch (status) {
      case "pendiente":
        return "orange";
      case "enviado":
        return "blue";
      case "entregado":
        return "green";
      default:
        return "gray";
    }
  };

  return (
    <div className="orders-container" style={{ padding: "20px" }}>
      <h2>Mis Pedidos</h2>

      {orders.length === 0 ? (
        <p>No tienes pedidos registrados.</p>
      ) : (
        orders.map(order => (
          <div key={order._id} className="order-card" style={{
            border: "1px solid #ccc", padding: "15px", marginBottom: "20px", borderRadius: "8px"
          }}>
            <p><strong>Fecha:</strong> {new Date(order.createdAt).toLocaleString()}</p>
            <p>
              <strong>Estado:</strong>{" "}
              <span style={{ color: getStatusColor(order.status), fontWeight: "bold" }}>
                {order.status}
              </span>
            </p>
            <p><strong>Total:</strong> ${order.total}</p>

            <ul>
              {order.items.map((item, idx) => (
                <li key={idx}>
                  {item.product ? (
                    <>
                      {item.quantity} x {item.product.name} (${item.product.price} c/u)
                      {item.size?.label && ` | Talla: ${item.size.label}`}
                      {item.color?.name && ` | Color: ${item.color.name}`}
                    </>
                  ) : (
                    <em>Producto no disponible</em>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
};

export default MyOrdersPage;
