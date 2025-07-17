import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../../contexts/AuthContext";
import OrderItemEditor from "../../../blocks/admin/OrderItemEditor";
import AdminOrderCommentBlock from "../../../blocks/admin/AdminOrderCommentBlock";

const AdminOrderDetailPage = () => {
  const { id } = useParams();
  const { token } = useContext(AuthContext);

  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [fields, setFields] = useState({
    trackingNumber: "",
    shippingCompany: "",
    adminComment: "",
  });

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setOrder(res.data);
        setItems(res.data.items);
        setFields({
          trackingNumber: res.data.trackingNumber || "",
          shippingCompany: res.data.shippingCompany || "",
          adminComment: res.data.adminComment || "",
        });
      });
  }, [id, token]);

  const handleItemChange = (index, updatedItem) => {
    const updatedItems = [...items];
    updatedItems[index] = updatedItem;
    setItems(updatedItems);
  };

  const handleFieldChange = (field, value) => {
    setFields((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    axios
      .put(
        `http://localhost:5000/api/orders/orders/${id}`,
        {
          items,
          ...fields,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then(() => {
        alert("Pedido actualizado con éxito");
        setTimeout(() => {
          navigate("/admin");
        }, 2000);
      })
      .catch((err) =>
        alert("Error al guardar cambios: " + err.response?.data?.error)
      );
  };

  const handleCancel = () => {
  // Si necesitas confirmar con el usuario:
  // if (window.confirm("¿Estás seguro de cancelar los cambios?")) {
  navigate('/admin/orders');
  // }
};

  if (!order) return <p>Cargando detalles del pedido...</p>;

  return (
    <div className="admin-order-detail-container">
      <h2>Detalles del pedido prueba</h2>
      <p>
        <strong>Usuario:</strong> {order.user?.email}
      </p>
      <p>
        <strong>Estado actual:</strong> {order.status}
      </p>

      {items.map((item, index) => (
        <OrderItemEditor
          key={item._id || index}
          item={item}
          index={index}
          onChange={handleItemChange}
        />
      ))}

      <AdminOrderCommentBlock
        comment={fields.adminComment}
        trackingNumber={fields.trackingNumber}
        shippingCompany={fields.shippingCompany}
        onFieldChange={handleFieldChange}
      />

      <button onClick={handleSave}>Guardar cambios</button>
      <button  onClick={handleCancel}>Cancelar</button>
    </div>
  );
};

export default AdminOrderDetailPage;
