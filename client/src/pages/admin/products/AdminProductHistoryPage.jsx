// pages/admin/products/AdminProductHistoryPage.jsx
import React, { useEffect, useState, useContext, useMemo } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; 
import * as XLSX from "xlsx";

const API = "http://localhost:5000/api";

const AdminProductHistoryPage = () => {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [ledger, setLedger] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState(""); // ACTIVE | DELETED | ""
  const [variantKey, setVariantKey] = useState("");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async (opts = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (opts.from) params.append("from", opts.from);
      if (opts.to) params.append("to", opts.to);
      if (opts.status) params.append("status", opts.status);
      if (opts.variantKey) params.append("variantKey", opts.variantKey);

      const [leg, sal] = await Promise.all([
        axios.get(
          `${API}/products/${id}/ledger?${params.toString()}`,
          authHeaders
        ),
        axios.get(
          `${API}/products/${id}/sales-history?${params.toString()}`,
          authHeaders
        ),
      ]);
      setLedger(Array.isArray(leg.data) ? leg.data : []);
      setSales(Array.isArray(sal.data) ? sal.data : []);
    } catch (e) {
      showToast("Error al obtener historiales", "error");
    } finally {
      setLoading(false);
    }
  };

  const onApplyFilters = () => {
    loadData({ from, to, status, variantKey });
  };

  const toLocal = (d) => (d ? new Date(d).toLocaleString() : "");

  // ===================== EXPORTS =====================
  const exportLedgerPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text("Historial por Variante (Libro Mayor)", 14, 14);

      const head = [
        [
          "Fecha",
          "Evento",
          "Variante",
          "Stock previo",
          "Stock nuevo",
          "Estado",
          "Precio (snap)",
          "Nota",
        ],
      ];
      const body = (ledger || []).map((r) => [
        toLocal(r.createdAt),
        r.eventType || "",
        `${r.sizeLabelSnapshot || "?"} / ${r.colorNameSnapshot || "?"}`,
        r.prevStock ?? "",
        r.newStock ?? "",
        r.status || "",
        typeof r.priceSnapshot === "number"
          ? r.priceSnapshot
          : r.priceSnapshot || "",
        r.note || "",
      ]);

      autoTable(doc, {
        startY: 20,
        head,
        body,
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [240, 240, 240] },
        didDrawPage: (data) => {
          // puedes agregar número de página, fecha, etc.
        },
      });

      doc.save(`historial_variantes_${id}.pdf`);
    } catch (e) {
      console.error(e);
      showToast("No se pudo exportar el PDF de variantes", "error");
    }
  };

  const exportSalesPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text("Historial de Ventas del Producto", 14, 14);

      const head = [["Fecha", "Variante", "Precio unit.", "Cantidad", "Total"]];
      const body = (sales || []).map((s) => [
        toLocal(s.date),
        `${s.sizeLabel || "?"} / ${s.colorName || "?"}`,
        typeof s.unitPrice === "number" ? s.unitPrice : s.unitPrice || 0,
        s.quantity ?? 0,
        typeof s.total === "number" ? s.total : s.total || 0,
      ]);

      autoTable(doc, {
        startY: 20,
        head,
        body,
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [240, 240, 240] },
      });

      doc.save(`historial_ventas_${id}.pdf`);
    } catch (e) {
      console.error(e);
      showToast("No se pudo exportar el PDF de ventas", "error");
    }
  };

  const exportLedgerCSV = () => {
    const rows = (ledger || []).map((r) => ({
      fecha: toLocal(r.createdAt),
      evento: r.eventType || "",
      variante: `${r.sizeLabelSnapshot || "?"} / ${r.colorNameSnapshot || "?"}`,
      stock_prev: r.prevStock ?? "",
      stock_nuevo: r.newStock ?? "",
      estado: r.status || "",
      precio_snapshot:
        typeof r.priceSnapshot === "number"
          ? r.priceSnapshot
          : r.priceSnapshot || "",
      nota: r.note || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, `historial_variantes_${id}.csv`);
  };

  const exportSalesCSV = () => {
    const rows = (sales || []).map((s) => ({
      fecha: toLocal(s.date),
      variante: `${s.sizeLabel || "?"} / ${s.colorName || "?"}`,
      precio_unitario:
        typeof s.unitPrice === "number" ? s.unitPrice : s.unitPrice || 0,
      cantidad: s.quantity ?? 0,
      total: typeof s.total === "number" ? s.total : s.total || 0,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ventas");
    XLSX.writeFile(wb, `historial_ventas_${id}.csv`);
  };

  // ===================== UI =====================
  return (
    <div className="history-container">
      <div className="header-row">
        <h2>Historial del producto</h2>
        <button
          className="btn-back"
          onClick={() => navigate("/admin/products")}
        >
          ← Volver
        </button>
      </div>

      <div className="filters">
        <label>
          Desde:
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label>
          Hasta:
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <label>
          Estado:
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos</option>
            <option value="ACTIVE">Activo</option>
            <option value="DELETED">Eliminado</option>
          </select>
        </label>
        <label>
          Variante (key):
          <input
            placeholder="sizeId::colorId"
            value={variantKey}
            onChange={(e) => setVariantKey(e.target.value)}
          />
        </label>
        <button className="btn" onClick={onApplyFilters}>
          Aplicar filtros
        </button>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          <section className="card">
            <div className="card-header">
              <h3>Historial por Variante (stock/estado)</h3>
              <div className="actions">
                <button onClick={exportLedgerPDF} className="btn">
                  Exportar PDF
                </button>
                <button onClick={exportLedgerCSV} className="btn">
                  Exportar CSV
                </button>
              </div>
            </div>
            <table className="history-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Evento</th>
                  <th>Variante</th>
                  <th>Stock previo</th>
                  <th>Stock nuevo</th>
                  <th>Estado</th>
                  <th>Precio (snapshot)</th>
                  <th>Nota</th>
                </tr>
              </thead>
              <tbody>
                {ledger.length === 0 ? (
                  <tr>
                    <td colSpan="8">Sin registros.</td>
                  </tr>
                ) : (
                  ledger.map((r) => (
                    <tr key={r._id}>
                      <td>{toLocal(r.createdAt)}</td>
                      <td>{r.eventType}</td>
                      <td>
                        {(r.sizeLabelSnapshot || "?") +
                          " / " +
                          (r.colorNameSnapshot || "?")}
                      </td>
                      <td>{r.prevStock ?? ""}</td>
                      <td>{r.newStock ?? ""}</td>
                      <td>{r.status}</td>
                      <td>
                        {typeof r.priceSnapshot === "number"
                          ? r.priceSnapshot
                          : r.priceSnapshot || ""}
                      </td>
                      <td>{r.note || ""}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>

          <section className="card">
            <div className="card-header">
              <h3>Historial de Ventas</h3>
              <div className="actions">
                <button onClick={exportSalesPDF} className="btn">
                  Exportar PDF
                </button>
                <button onClick={exportSalesCSV} className="btn">
                  Exportar CSV
                </button>
              </div>
            </div>
            <table className="history-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Variante</th>
                  <th>Precio unit.</th>
                  <th>Cantidad</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan="5">Sin ventas registradas.</td>
                  </tr>
                ) : (
                  sales.map((s, idx) => (
                    <tr key={idx}>
                      <td>{toLocal(s.date)}</td>
                      <td>
                        {(s.sizeLabel || "?") + " / " + (s.colorName || "?")}
                      </td>
                      <td>
                        {typeof s.unitPrice === "number"
                          ? s.unitPrice
                          : s.unitPrice || 0}
                      </td>
                      <td>{s.quantity ?? 0}</td>
                      <td>
                        {typeof s.total === "number" ? s.total : s.total || 0}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
};

export default AdminProductHistoryPage;
