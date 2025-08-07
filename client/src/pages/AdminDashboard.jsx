import { useEffect, useState, useContext } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import { AuthContext } from "../contexts/AuthContext";
import FilterExportControls from "../blocks/admin/FilterExportControls";
import OrderCardBlock from "../blocks/admin/OrderCardBlock";
import logo from "../assets/PPFINAL.png";

const AdminOrdersPage = ({ statusFilterProp = "pendiente" }) => {
  const { token } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState(statusFilterProp);
  const [emailFilter, setEmailFilter] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = () => {
    axios
      .get("http://localhost:5000/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setOrders(res.data))
      .catch((err) => console.error("Error al obtener pedidos:", err));
  };

  const handleStatusChange = (id, status) => {
    axios
      .put(
        `http://localhost:5000/api/orders/${id}`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then(() => fetchOrders())
      .catch(() => alert("Error al actualizar estado"));
  };

  const applyFilters = () => {
    return orders.filter((order) => {
      const emailMatch = order.user?.email
        .toLowerCase()
        .includes(emailFilter.toLowerCase());
      const statusMatch =
        statusFilter === "todos" || order.status === statusFilter;
      const dateMatch =
        (!dateRange.from ||
          dayjs(order.createdAt).isAfter(
            dayjs(dateRange.from).startOf("day")
          )) &&
        (!dateRange.to ||
          dayjs(order.createdAt).isBefore(dayjs(dateRange.to).endOf("day")));

      return emailMatch && statusMatch && dateMatch;
    });
  };

  const filteredOrders = applyFilters();

  // ✅ Función para exportar a PDF
  const exportToPDF = () => {
    const doc = new jsPDF("landscape");

    // Logo
    doc.addImage(logo, "PNG", 14, 10, 30, 15);

    // Título
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text("Reporte de Pedidos", 14, 30);
    doc.line(14, 32, 285, 32); // línea horizontal (landscape)

    const rows = filteredOrders.flatMap((order) =>
      order.items.map((item) => [
        order.user?.name || "N/A",
        order.user?.email || "N/A",
        new Date(order.createdAt).toLocaleString(),
        item.product?.name || "Eliminado",
        item.size?.label || "-",
        item.color?.name || "-",
        item.quantity,
        item.product?.price?.toFixed(2) || "-",
        order.total?.toFixed(2) || "-",
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
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
      },
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

    doc.save(`pedidos_${statusFilter}.pdf`);
  };

  // ✅ Función para exportar a Excel
  const exportToExcel = () => {
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
    saveAs(data, "pedidos.xlsx");
  };

  const handleCancel = (id) => {
    if (window.confirm("¿Estás seguro de cancelar este pedido?")) {
      axios
        .put(
          `http://localhost:5000/api/orders/cancel/${id}`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        .then(() => fetchOrders())
        .catch(() => alert("Error al cancelar el pedido"));
    }
  };

  return (
    <div className="admin-orders-container" style={{ padding: "20px" }}>
      <h2>Gestión de Pedidos</h2>

      <FilterExportControls
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        emailFilter={emailFilter}
        setEmailFilter={setEmailFilter}
        dateRange={dateRange}
        setDateRange={setDateRange}
        exportToPDF={exportToPDF}
        exportToExcel={exportToExcel}
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
