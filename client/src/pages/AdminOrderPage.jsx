import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";
import AdminOrderRow from "../blocks/admin/AdminOrderBlock";

const AdminOrderPage = () => {
  const [orders, setOrders] = useState([]);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
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

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Historial de Pedidos</h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Total</th>
            <th>Fecha</th>
            <th>Productos</th>
            <th>Cantidad</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <AdminOrderRow key={order._id} order={order} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminOrderPage;
