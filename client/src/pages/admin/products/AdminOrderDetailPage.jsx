import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../../contexts/AuthContext";
import OrderItemEditor from "../../../blocks/admin/OrderItemEditorBlocks";
import AdminOrderCommentBlock from "../../../blocks/admin/AdminOrderCommentBlock";
import { toast } from "react-toastify";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  FaSave,
  FaTimesCircle,
  FaUser,
  FaTruck,
  FaClipboardList,
} from "react-icons/fa";

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
  const [orderIds, setOrderIds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

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

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/orders/ids/all", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const ids = res.data;
        setOrderIds(ids);
        const index = ids.findIndex((oid) => oid === id);
        setCurrentIndex(index);
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

  const goToOrder = (offset) => {
    const newIndex = currentIndex + offset;
    if (newIndex >= 0 && newIndex < orderIds.length) {
      const nextId = orderIds[newIndex];
      navigate(`/admin/orders/${nextId}`);
    }
  };

  const exportSingleOrderToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Factura de Pedido`, 50, 14);
    doc.text(`ID del pedido: ${order._id}`, 14, 24);
    doc.text(`Usuario Nombre: ${order.user?.name || "N/A"}`, 14, 32);
    doc.text(`Usuario Correo: ${order.user?.email || "N/A"}`, 14, 40);
    doc.text(`Fecha: ${new Date(order.createdAt).toLocaleString()}`, 14, 48);
    doc.text(`Estado: ${order.status}`, 14, 56);

    if (order.trackingNumber) {
      doc.text(`Guía: ${order.trackingNumber}`, 14, 56);
    }
    if (order.shippingCompany) {
      doc.text(`Transportadora: ${order.shippingCompany}`, 14, 64);
    }

    const itemsRows = order.items.map((item) => [
      item.product?.name || "Producto eliminado",
      item.size?.label || "-",
      item.color?.name || "-",
      item.quantity,
      `$${item.product?.price?.toFixed(2) || "-"}`,
      `$${(item.quantity * (item.product?.price || 0)).toFixed(2)}`,
    ]);

    autoTable(doc, {
      head: [["Producto", "Talla", "Color", "Cantidad", "Precio", "Subtotal"]],
      body: itemsRows,
      startY: 72,
    });

    doc.text(
      `Total: $${order.total.toFixed(2)}`,
      14,
      doc.lastAutoTable.finalY + 10
    );

    if (order.adminComment) {
      doc.text(
        "Comentario del administrador:",
        14,
        doc.lastAutoTable.finalY + 20
      );
      doc.text(order.adminComment, 14, doc.lastAutoTable.finalY + 28);
    }

    doc.save(`pedido_${order._id}.pdf`);
  };

  if (!order) return <p>Cargando detalles del pedido...</p>;

  return (
    <div className="admin-order-detail-container">
      <div className="admin-order-section">
        <h3>
          <FaClipboardList /> Información del pedido
        </h3>
        <p>
          <strong>
            <FaUser /> Usuario Email:
          </strong>{" "}
          {order.user?.email}
        </p>
        <p>
          <strong>
            Usuario Nombre:
          </strong>{" "}
          {order.user?.name}
        </p>
        <p>
          <strong>Estado actual:</strong> {order.status}
        </p>
      </div>
      <div>
        <button onClick={exportSingleOrderToPDF}>Descargar PDF</button>
      </div>

      <div className="admin-order-section">
        <h3>
          <FaClipboardList /> Productos del pedido
        </h3>
        {items.map((item, index) => (
          <OrderItemEditor
            key={item._id || index}
            item={item}
            index={index}
            onChange={handleItemChange}
          />
        ))}
      </div>

      <div className="admin-order-section">
        <h3>
          <FaTruck /> Información de envío
        </h3>
        <AdminOrderCommentBlock
          comment={fields.adminComment}
          trackingNumber={fields.trackingNumber}
          shippingCompany={fields.shippingCompany}
          onFieldChange={handleFieldChange}
        />
      </div>

      <div className="admin-order-section">
        <h3>💾 Acciones</h3>
        <button
          onClick={handleSave}
          disabled={isSaving}
          title="Guardar cambios en el pedido"
          style={{
            opacity: isSaving ? 0.6 : 1,
            cursor: isSaving ? "not-allowed" : "pointer",
          }}
        >
          <FaSave style={{ marginRight: "8px" }} />
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </button>

        <button
          onClick={handleCancel}
          title="Cancelar cambios y volver"
          style={{ backgroundColor: "#ccc", color: "#333" }}
        >
          <FaTimesCircle style={{ marginRight: "6px" }} />
          Cancelar
        </button>
        <div style={{ marginTop: "1rem" }}>
          <button onClick={() => navigate("/admin")}>
            🔙 Volver al listado
          </button>

          <button
            onClick={() => goToOrder(-1)}
            disabled={currentIndex <= 0}
            style={{ marginLeft: "1rem" }}
          >
            ⬅ Pedido anterior
          </button>

          <button
            onClick={() => goToOrder(1)}
            disabled={currentIndex >= orderIds.length - 1}
            style={{ marginLeft: "1rem" }}
          >
            Pedido siguiente ➡
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetailPage;
