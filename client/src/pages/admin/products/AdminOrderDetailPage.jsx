import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../../contexts/AuthContext";
import AdminOrderCommentBlock from "../../../blocks/admin/AdminOrderCommentBlock";
import { toast } from "react-toastify";
import { formatCOP } from "../../../utils/currency";

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

  // ====== PDF (landscape) con mini-tabla "Variante" y COP ======
  const exportSingleOrderToPDF = () => {
    if (!order) return;

    // Paleta
    const HEAD_BG = [10, 102, 194];   // azul
    const HEAD_TX = [255, 255, 255];  // blanco
    const GRID = [220, 226, 235];     // gris líneas
    const ALT_ROW = [244, 248, 254];  // zebra

    const doc = new jsPDF({ orientation: "landscape", unit: "mm" });

    // Encabezado del documento
    doc.setFontSize(14);
    doc.text("Factura de Pedido", 14, 12);

    doc.setFontSize(10);
    doc.text(`ID del pedido: ${order._id}`, 14, 20);
    doc.text(`Usuario Nombre: ${order.user?.name || "N/A"}`, 14, 26);
    doc.text(`Usuario Correo: ${order.user?.email || "N/A"}`, 14, 32);
    doc.text(`Fecha: ${new Date(order.createdAt).toLocaleString()}`, 14, 38);
    doc.text(`Estado: ${order.status}`, 14, 44);

    let y = 50;
    if (order.trackingNumber) {
      doc.text(`Guía: ${order.trackingNumber}`, 14, y);
      y += 6;
    }
    if (order.shippingCompany) {
      doc.text(`Transportadora: ${order.shippingCompany}`, 14, y);
      y += 6;
    }

    // Columnas con dataKey para mini-tabla
    const columns = [
      { header: "Producto", dataKey: "product" },
      { header: "Variante", dataKey: "variant" }, // mini-tabla
      { header: "Cantidad", dataKey: "qty" },
      { header: "Precio", dataKey: "price" },
      { header: "Subtotal", dataKey: "subtotal" },
    ];

    // Filas
    const body = (order.items || []).map((item) => {
      const hasPrice = typeof item.product?.price === "number";
      const price = hasPrice ? item.product.price : 0;
      const qty = Number(item.quantity) || 0;
      const subtotal = qty * Number(price);

      return {
        product: item.product?.name || "Producto eliminado",
        variant: {
          size: item.size?.label || "-",
          color: item.color?.name || "-",
        }, // objeto para dibujar
        qty,
        price: hasPrice ? formatCOP(price) : "-",
        subtotal: hasPrice ? formatCOP(subtotal) : "-",
      };
    });

    autoTable(doc, {
      startY: y + 4,
      columns,
      body,
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 2.5,
        lineColor: GRID,
        lineWidth: 0.2,
        valign: "middle",
      },
      headStyles: {
        fillColor: HEAD_BG,
        textColor: HEAD_TX,
        lineWidth: 0,
      },
      alternateRowStyles: {
        fillColor: ALT_ROW,
      },
      columnStyles: {
        product: { cellWidth: 80 },
        variant: { cellWidth: 50 },
        qty: { halign: "right", cellWidth: 22 },
        price: { halign: "right", cellWidth: 30 },
        subtotal: { halign: "right", cellWidth: 32 },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.dataKey === "variant") {
          // quitamos el texto normal para dibujar la mini-tabla
          data.cell.text = [];
        }
      },
      didDrawCell: (data) => {
        if (data.section !== "body" || data.column.dataKey !== "variant")
          return;

        const Doc = data.doc;
        const { x, y, width, height } = data.cell;

        // padding interno
        const pad = 1.5;
        const ix = x + pad;
        const iy = y + pad;
        const iw = width - pad * 2;
        const ih = height - pad * 2;

        const headerH = Math.min(6, ih * 0.35);
        const midX = ix + iw / 2;

        // Marco
        Doc.setDrawColor(GRID[0], GRID[1], GRID[2]);
        Doc.setLineWidth(0.2);
        Doc.rect(ix, iy, iw, ih);

        // Header
        Doc.setFillColor(235, 240, 248);
        Doc.rect(ix, iy, iw, headerH, "F");

        // Divisor vertical
        Doc.setDrawColor(GRID[0], GRID[1], GRID[2]);
        Doc.line(midX, iy, midX, iy + ih);

        // Títulos
        Doc.setTextColor(31, 45, 61);
        Doc.setFontSize(8.5);
        Doc.text("Talla", ix + 2, iy + headerH - 2);
        Doc.text("Color", midX + 2, iy + headerH - 2);

        // Valores
        const val = data.cell.raw || {};
        const valueY = iy + headerH + 4.5;
        Doc.setTextColor(55, 65, 81);
        Doc.setFontSize(9);
        Doc.text(String(val.size ?? "-"), ix + 2, valueY);
        Doc.text(String(val.color ?? "-"), midX + 2, valueY);
      },
    });

    // Total al final
    const endY = doc.lastAutoTable?.finalY ?? y + 4;
    doc.setFontSize(11);
    doc.text(`Total: ${formatCOP(order.total ?? 0)}`, 14, endY + 8);

    // Comentario admin (si existe)
    if (order.adminComment) {
      doc.setFontSize(10);
      doc.text("Comentario del administrador:", 14, endY + 16);
      doc.text(order.adminComment, 14, endY + 22);
    }

    doc.save(`pedido_${order._id}.pdf`);
  };

  if (!order) return <p className="loading">Cargando detalles del pedido...</p>;

  const priceFmt = (n) => formatCOP(n);

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
                <th>Variante</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item, idx) => {
                const hasPrice = typeof item.product?.price === "number";
                const price = hasPrice ? item.product.price : 0;
                const qty = Number(item.quantity) || 0;
                const subtotal = qty * Number(price);
                return (
                  <tr key={item._id || idx}>
                    <td>{item.product?.name || "Producto eliminado"}</td>

                    {/* === Variante como mini-tabla dentro de la celda === */}
                    <td className="variant-cell">
                      <table className="variant-mini-table">
                        <thead>
                          <tr>
                            <th>Talla</th>
                            <th>Color</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>{item.size?.label || "-"}</td>
                            <td>{item.color?.name || "-"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>

                    <td>{qty}</td>
                    <td>{hasPrice ? priceFmt(price) : "-"}</td>
                    <td>{hasPrice ? priceFmt(subtotal) : "-"}</td>
                  </tr>
                );
              })}
              {(!order.items || order.items.length === 0) && (
                <tr>
                  <td colSpan={5}>
                    <em>Sin ítems</em>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td className="total-label" colSpan={4}>
                  Total
                </td>
                <td className="total-value">{priceFmt(order.total ?? 0)}</td>
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
