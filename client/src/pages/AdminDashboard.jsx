import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") return navigate("/");

    const fetchOrders = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Ordenar por fecha descendente (más reciente primero)
        const sorted = res.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setOrders(sorted);
      } catch {
        alert("Error al cargar pedidos.");
      }
    };

    fetchOrders();
  }, [token]);

  const updateStatus = async (id, status) => {
    try {
      await axios.put(
        `http://localhost:5000/api/orders/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, status } : o))
      );

      setSuccessMsg("Pedido actualizado correctamente.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch {
      alert("Error al actualizar el estado del pedido.");
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Panel de Administración</h2>

      {successMsg && (
        <div className="bg-green-100 text-green-800 border border-green-400 px-4 py-2 mb-4 rounded">
          {successMsg}
        </div>
      )}

      {orders.map((order) => (
        <div
          key={order._id}
          className={`border p-4 mb-4 rounded ${
            order.status === "pendiente" ? "border-yellow-500 bg-yellow-50" : ""
          }`}
        >
          <p>
            <strong>Cliente:</strong> {order.user?.name || "Usuario eliminado"}
          </p>
          <p>
            <strong>Total:</strong> ${order.total}
          </p>
          <p>
            <strong>Fecha:</strong>{" "}
            {new Date(order.createdAt).toLocaleString()}
          </p>
          <p>
            <strong>Estado:</strong>{" "}
            <span className="capitalize">{order.status}</span>
          </p>

          <ul className="list-disc pl-5 my-2">
            {order.items.map((item) => (
              <li key={item._id}>
                {item.quantity} × {item.product?.name || "Producto eliminado"}
              </li>
            ))}
          </ul>

          <select
            value={order.status}
            onChange={(e) => updateStatus(order._id, e.target.value)}
            className="mt-2 p-1 border rounded"
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
