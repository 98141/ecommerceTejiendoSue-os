import { useEffect, useState, useContext } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";

import { AuthContext } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import FilterExportControls from "../blocks/admin/FilterExportControls";
import OrderCardBlock from "../blocks/admin/OrderCardBlock";
import { formatCOP } from "../utils/currency";

import logo from "../assets/PPFINAL.png";

const AdminOrdersPage = ({ statusFilterProp = "pendiente" }) => {
  const { token } = useContext(AuthContext);
  const { showToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState(statusFilterProp);
  const [searchFilter, setSearchFilter] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [dateError, setDateError] = useState("");

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = () => {
    axios
      .get("http://localhost:5000/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setOrders(res.data))
      .catch((err) => console.error("Error al obtener pedidos:", err));
  };

  // ⬇️ Cambios importantes: retorna promesa + toasts
  const handleStatusChange = (id, status) => {
    return axios
      .patch(
        `http://localhost:5000/api/orders/${id}/status`,
        { status },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then(() => {
        fetchOrders();
        showToast(`Estado actualizado a “${status}”`, "success");
      })
      .catch((err) => {
        console.error(
          "Error al actualizar estado:",
          err?.response?.data || err.message
        );
        showToast("No se pudo actualizar el estado", "error");
        throw err;
      });
  };

  // ⬇️ Cancelación sin confirm nativa (el Card abrirá tu ConfirmModal)
  const handleCancel = (id) => {
    return axios
      .post(
        `http://localhost:5000/api/orders/${id}/cancel`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then(() => {
        fetchOrders();
        showToast("Pedido cancelado y stock restablecido", "info");
      })
      .catch((err) => {
        console.error(
          "Error al cancelar pedido:",
          err?.response?.data || err.message
        );
        showToast("No se pudo cancelar el pedido", "error");
        throw err;
      });
  };

  // ✅ Validar fechas
  const validateDateRange = (from, to) => {
    if (from && !to) return "Seleccione también una fecha de fin (Hasta).";
    if (!from && to) return "Seleccione también una fecha de inicio (Desde).";
    if (from && to && dayjs(to).isBefore(dayjs(from)))
      return "La fecha Hasta no puede ser anterior a la fecha Desde.";
    return "";
  };

  useEffect(() => {
    const error = validateDateRange(dateRange.from, dateRange.to);
    setDateError(error);
  }, [dateRange]);

  const applyFilters = () => {
    const isValid = validateDateRange(dateRange.from, dateRange.to) === "";

    return orders.filter((order) => {
      const search = searchFilter.toLowerCase();

      const matchSearch =
        order._id.toLowerCase().includes(search) ||
        order.user?.email?.toLowerCase().includes(search) ||
        order.user?.name?.toLowerCase().includes(search);

      const matchStatus =
        statusFilter === "todos" || order.status === statusFilter;

      const matchDate = isValid
        ? (!dateRange.from ||
            dayjs(order.createdAt).isAfter(
              dayjs(dateRange.from).startOf("day")
            )) &&
          (!dateRange.to ||
            dayjs(order.createdAt).isBefore(dayjs(dateRange.to).endOf("day")))
        : true;

      return matchSearch && matchStatus && matchDate;
    });
  };

  const filteredOrders = applyFilters();

  const exportToPDF = () => {
    if (dateError) return alert(dateError);

    const doc = new jsPDF("landscape");
    doc.addImage(logo, "PNG", 14, 10, 30, 15);
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text("Reporte de Pedidos", 14, 30);
    doc.line(14, 32, 285, 32);

    const rows = filteredOrders.flatMap((order) =>
      order.items.map((item) => [
        order.user?.name || "N/A",
        order.user?.email || "N/A",
        new Date(order.createdAt).toLocaleString(),
        item.product?.name || "Eliminado",
        item.size?.label || "-",
        item.color?.name || "-",
        item.quantity,
        item.product?.price ? formatCOP(item.product.price) : "-",
        order.total ? formatCOP(order.total) : "-",
        order.status,
      ])
    );

    autoTable(doc, {
      startY: 36,
      head: [
        [
          "Usuario",
          "Email",
          "Fecha",
          "Producto",
          "Talla",
          "Color",
          "Cantidad",
          "Precio",
          "Total",
          "Estado",
        ],
      ],
      body: rows,
      styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 40 },
        2: { cellWidth: 35 },
        3: { cellWidth: 40 },
      },
      didDrawPage: (data) => {
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(10);
        doc.text(
          `Página ${doc.internal.getNumberOfPages()}`,
          data.settings.margin.left,
          pageHeight - 10
        );
      },
    });

    const friendlyName = searchFilter || statusFilter || "todos";
    const today = dayjs().format("YYYY-MM-DD");
    doc.save(`pedidos_${friendlyName}_${today}.pdf`);
  };

  const exportToExcel = () => {
    if (dateError) return alert(dateError);

    const rows = filteredOrders.flatMap((order) =>
      order.items.map((item) => ({
        ID: order._id,
        Usuario: order.user?.email || "N/A",
        Fecha: new Date(order.createdAt).toLocaleString(),
        Producto: item.product?.name || "Eliminado",
        Talla: item.size?.label || "-",
        Color: item.color?.name || "-",
        Cantidad: item.quantity,
        "Precio Unitario": item.product?.price || "-",
        Total: order.total,
        Estado: order.status,
      }))
    );

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pedidos");

    const excelBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });

    const friendlyName = searchFilter || statusFilter || "todos";
    const today = dayjs().format("YYYY-MM-DD");
    saveAs(data, `pedidos_${friendlyName}_${today}.xlsx`);
  };

  return (
    <div className="admin-orders-container" style={{ padding: "20px" }}>
      <h2>Gestión de Pedidos</h2>

      {dateError && (
        <div style={{ color: "red", fontWeight: "bold", marginBottom: "10px" }}>
          {dateError}
        </div>
      )}

      <FilterExportControls
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        searchFilter={searchFilter}
        setSearchFilter={setSearchFilter}
        dateRange={dateRange}
        setDateRange={setDateRange}
        exportToPDF={exportToPDF}
        exportToExcel={exportToExcel}
        dateError={dateError}
        hasResults={filteredOrders.length > 0}
      />

      {filteredOrders.length === 0 ? (
        <p>No hay pedidos con esos filtros.</p>
      ) : (
        filteredOrders.map((order) => (
          <OrderCardBlock
            key={order._id}
            order={order}
            onStatusChange={handleStatusChange}
            onCancel={handleCancel}
          />
        ))
      )}
    </div>
  );
};

export default AdminOrdersPage;
