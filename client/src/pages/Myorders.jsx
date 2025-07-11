import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import axios from "axios";
import { Link } from "react-router-dom";

const MyOrders = () => {
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
    <div style={{ padding: 20 }}>
      <h2>Mis pedidos</h2>
      {orders.length === 0 ? (
        <p>No tienes pedidos registrados.</p>
      ) : (
        orders.map(order => (
          <div key={order._id} style={{ border: "1px solid #ccc", marginBottom: 20, padding: 10 }}>
            <p><strong>Fecha:</strong> {new Date(order.createdAt).toLocaleString()}</p>
            <p>
              <strong>Estado:</strong>{" "}
              <span style={{ color: getStatusColor(order.status), fontWeight: "bold" }}>
                {order.status}
              </span>
            </p>
            <p><strong>Total:</strong> ${order.total}</p>
            <ul>
              {order.items.map(item => (
                <li key={item._id}>
                  {item.quantity} x {item.product.name} (${item.product.price} c/u)
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>

  );
};

export default MyOrders;
