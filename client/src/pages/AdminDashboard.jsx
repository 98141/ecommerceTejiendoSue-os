import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user || user.role !== "admin") return navigate("/");

    axios.get("http://localhost:5000/api/orders", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setOrders(res.data));
  }, [token]);

  const updateStatus = (id, status) => {
    axios.put(`http://localhost:5000/api/orders/${id}`, { status }, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(() => {
      setOrders(orders.map(o => o._id === id ? { ...o, status } : o));
    });
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Panel de Administración</h2>
      {orders.map(order => (
        <div key={order._id} className="border p-4 mb-4">
          <p><strong>Cliente:</strong> {order.user.name}</p>
          <p><strong>Total:</strong> ${order.total}</p>
          <p><strong>Estado:</strong> {order.status}</p>
          <ul className="list-disc pl-5">
            {order.items.map(item => (
              <li key={item._id}>
                {item.quantity} x {item.product.name}
              </li>
            ))}
          </ul>
          <select
            value={order.status}
            onChange={(e) => updateStatus(order._id, e.target.value)}
            className="mt-2 p-1 border"
          >
            <option value="pendiente">Pendiente</option>
            <option value="enviado">Enviado</option>
            <option value="entregado">Entregado</option>
          </select>
        </div>
      ))}
    </div>
  );
};

export default AdminDashboard;
