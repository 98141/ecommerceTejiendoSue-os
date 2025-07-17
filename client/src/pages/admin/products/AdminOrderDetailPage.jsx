import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../../contexts/AuthContext";
import OrderItemEditor from "../../../blocks/admin/OrderItemEditorBlocks";
import AdminOrderCommentBlock from "../../../blocks/admin/AdminOrderCommentBlock";
import { toast } from "react-toastify";

const AdminOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { token } = useContext(AuthContext);

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [fields, setFields] = useState({
    trackingNumber: "",
    shippingCompany: "",
    adminComment: "",
  });

  const [isSaving, setIsSaving] = useState(false);

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
    setIsSaving(true); // Desactiva el botón

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
        toast.success("Pedido actualizado con éxito");
        setTimeout(() => {
          navigate("/admin");
        }, 3500);
      })
      .catch((err) => {
        toast.error(
          err.response?.data?.error || "Error al guardar los cambios"
        );
        setIsSaving(false); // ✅ Reactivar el botón en caso de error
      });
  };

  const handleCancel = () => {
    // Si necesitas confirmar con el usuario:
    // if (window.confirm("¿Estás seguro de cancelar los cambios?")) {
    navigate("/admin");
    // }
  };

  if (!order) return <p>Cargando detalles del pedido...</p>;

  return (
    <div className="admin-order-detail-container">
      <h2>Detalles del pedido</h2>
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

      <button
        onClick={handleSave}
        disabled={isSaving}
        style={{
          opacity: isSaving ? 0.6 : 1,
          cursor: isSaving ? "not-allowed" : "pointer",
        }}
      >
        {isSaving ? "Guardando..." : "Guardar cambios"}
      </button>
      <button onClick={handleCancel}>Cancelar</button>
    </div>
  );
};

export default AdminOrderDetailPage;
