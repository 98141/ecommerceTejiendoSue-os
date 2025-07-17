import { useParams } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../../contexts/AuthContext";

const AdminOrderDetailPage = () => {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setOrder(res.data))
    .catch(() => alert("No se pudo cargar el pedido"));
  }, [id, token]);

  if (!order) return <p>Cargando detalle del pedido...</p>;

  return (
    <div className="admin-order-detail">
      <h2>Detalle del Pedido</h2>
      <p><strong>Usuario:</strong> {order.user?.email}</p>
      <p><strong>Fecha:</strong> {new Date(order.createdAt).toLocaleString()}</p>
      <p><strong>Estado:</strong> {order.status}</p>
      <p><strong>Total:</strong> ${order.total}</p>

      <h3>Productos:</h3>
      <ul>
        {order.items.map((item, i) => (
          <li key={i}>
            {item.quantity} x {item.product?.name || "Eliminado"} - 
            Talla: {item.size?.label || "-"}, 
            Color: {item.color?.name || "-"}, 
            Precio: ${item.product?.price || 0}
          </li>
        ))}
      </ul>

      {/* Aquí luego agregaremos campos para comentarios, guía, transportadora, etc */}
    </div>
  );
};

export default AdminOrderDetailPage;
