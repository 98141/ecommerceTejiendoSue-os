import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../../contexts/AuthContext";
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
  const [fields, setFields] = useState({
    trackingNumber: "",
    shippingCompany: "",
    adminComment: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [orderIds, setOrderIds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrder(res.data);
        setFields({
          trackingNumber: res.data.trackingNumber || "",
          shippingCompany: res.data.shippingCompany || "",
          adminComment: res.data.adminComment || "",
        });
      } catch (err) {
        console.error(
          "Error cargando pedido:",
          err?.response?.data || err.message
        );
        toast.error("No se pudo cargar el pedido");
      }
    };
    fetchOrder();
  }, [id, token]);

  useEffect(() => {
    const fetchIds = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/orders/ids", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const ids = res.data || [];
        setOrderIds(ids);
        const index = ids.findIndex((oid) => oid === id);
        setCurrentIndex(index);
      } catch (err) {
        console.error(
          "Error cargando IDs de pedidos:",
          err?.response?.data || err.message
        );
      }
    };
    fetchIds();
  }, [id, token]);

  const handleFieldChange = (field, value) => {
    setFields((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        trackingNumber: fields.trackingNumber,
        shippingCompany: fields.shippingCompany,
        adminComment: fields.adminComment,
      };

      await axios.put(`http://localhost:5000/api/orders/${id}`, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Pedido actualizado con éxito");
      setTimeout(() => navigate("/admin"), 1200);
    } catch (err) {
      console.error(
        "Error al guardar los cambios:",
        err?.response?.data || err.message
      );
      toast.error(err?.response?.data?.error || "Error al guardar los cambios");
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin");
  };

  const goToOrder = (offset) => {
    const newIndex = currentIndex + offset;
    if (newIndex >= 0 && newIndex < orderIds.length) {
      const nextId = orderIds[newIndex];
      navigate(`/admin/orders/${nextId}`);
    }
  };

  const exportSingleOrderToPDF = () => {
    if (!order) return;
    const doc = new jsPDF();
    doc.text(`Factura de Pedido`, 50, 14);
    doc.text(`ID del pedido: ${order._id}`, 14, 24);
    doc.text(`Usuario Nombre: ${order.user?.name || "N/A"}`, 14, 32);
    doc.text(`Usuario Correo: ${order.user?.email || "N/A"}`, 14, 40);
    doc.text(`Fecha: ${new Date(order.createdAt).toLocaleString()}`, 14, 48);
    doc.text(`Estado: ${order.status}`, 14, 56);

    let y = 64;
    if (order.trackingNumber) {
      doc.text(`Guía: ${order.trackingNumber}`, 14, y);
      y += 8;
    }
    if (order.shippingCompany) {
      doc.text(`Transportadora: ${order.shippingCompany}`, 14, y);
      y += 8;
    }

    const itemsRows = (order.items || []).map((item) => [
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
      startY: y + 8,
    });

    doc.text(
      `Total: $${order.total?.toFixed(2) || "0.00"}`,
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

  if (!order) return <p className="loading">Cargando detalles del pedido...</p>;

  const priceFmt = (n) =>
    typeof n === "number" && !Number.isNaN(n) ? n.toFixed(2) : "-";

  return (
    <div className="admin-order-detail">
      <div className="section">
        <h3 className="section__title">
          <FaClipboardList className="icon" /> Información del pedido
        </h3>
        <p className="field">
          <strong>
            <FaUser className="icon" /> Usuario Email:
          </strong>{" "}
          {order.user?.email}
        </p>
        <p className="field">
          <strong>Usuario Nombre:</strong> {order.user?.name}
        </p>
        <p className="field">
          <strong>Estado actual:</strong> {order.status}
        </p>
      </div>

      <div className="actions-top">
        <button className="btn btn--ghost" onClick={exportSingleOrderToPDF}>
          Descargar PDF
        </button>
      </div>

      {/* Productos del pedido: tabla solo lectura */}
      <div className="section">
        <h3 className="section__title">
          <FaClipboardList className="icon" /> Productos del pedido
        </h3>

        <div className="table-responsive">
          <table className="table table-order-items">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Talla</th>
                <th>Color</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item, idx) => {
                const price = item.product?.price ?? 0;
                const qty = Number(item.quantity) || 0;
                const subtotal = qty * Number(price);
                return (
                  <tr key={item._id || idx}>
                    <td>{item.product?.name || "Producto eliminado"}</td>
                    <td>{item.size?.label || "-"}</td>
                    <td>{item.color?.name || "-"}</td>
                    <td>{qty}</td>
                    <td>${priceFmt(price)}</td>
                    <td>${priceFmt(subtotal)}</td>
                  </tr>
                );
              })}
              {(!order.items || order.items.length === 0) && (
                <tr>
                  <td colSpan={6}>
                    <em>Sin ítems</em>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td className="total-label" colSpan={5}>
                  Total
                </td>
                <td className="total-value">
                  ${order.total?.toFixed(2) || "0.00"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Metadatos editables */}
      <div className="section">
        <h3 className="section__title">
          <FaTruck className="icon" /> Información de envío
        </h3>
        <AdminOrderCommentBlock
          comment={fields.adminComment}
          trackingNumber={fields.trackingNumber}
          shippingCompany={fields.shippingCompany}
          onFieldChange={handleFieldChange}
        />
      </div>

      {/* Acciones */}
      <div className="section">
        <h3 className="section__title">💾 Acciones</h3>
        <div className="actions-row">
          <button
            onClick={handleSave}
            className={`btn btn--primary ${isSaving ? "is-disabled" : ""}`}
            disabled={isSaving}
            title="Guardar cambios en el pedido"
          >
            <FaSave className="icon" />
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </button>

          <button
            onClick={handleCancel}
            className="btn btn--muted"
            title="Cancelar cambios y volver"
          >
            <FaTimesCircle className="icon" />
            Cancelar
          </button>
        </div>

        <div className="nav-row">
          <button className="btn btn--ghost" onClick={() => navigate("/admin")}>
            🔙 Volver al listado
          </button>

          <button
            className="btn btn--ghost"
            onClick={() => goToOrder(-1)}
            disabled={currentIndex <= 0}
          >
            ⬅ Pedido anterior
          </button>

          <button
            className="btn btn--ghost"
            onClick={() => goToOrder(1)}
            disabled={currentIndex >= orderIds.length - 1}
          >
            Pedido siguiente ➡
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetailPage;
