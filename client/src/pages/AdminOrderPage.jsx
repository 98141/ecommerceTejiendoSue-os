import React, { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";
import { formatCOP } from "../utils/currency";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const API = "http://localhost:5000/api";

const AdminSalesHistoryPage = () => {
  const { token } = useContext(AuthContext);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("");
  const [productId, setProductId] = useState("");
  const [sizeId, setSizeId] = useState("");
  const [colorId, setColorId] = useState("");
  const [userId, setUserId] = useState("");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const fetchData = async (opts = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (opts.from) params.append("from", opts.from);
      if (opts.to) params.append("to", opts.to);
      if (opts.status) params.append("status", opts.status);
      if (opts.productId) params.append("productId", opts.productId);
      if (opts.sizeId) params.append("sizeId", opts.sizeId);
      if (opts.colorId) params.append("colorId", opts.colorId);
      if (opts.userId) params.append("userId", opts.userId);

      const res = await axios.get(
        `${API}/orders/sales-history?${params.toString()}`,
        authHeaders
      );
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      alert("Error al cargar historial general de ventas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onApplyFilters = () => {
    fetchData({ from, to, status, productId, sizeId, colorId, userId });
  };

  const toLocal = (d) => (d ? new Date(d).toLocaleString() : "");

  // Sumatorios
  const totals = useMemo(() => {
    let sumTotal = 0,
      sumQty = 0;
    for (const r of rows) {
      sumTotal += Number(r.total) || 0;
      sumQty += Number(r.quantity) || 0;
    }
    return { sumTotal, sumQty };
  }, [rows]);

  // ======= Export PDF (COP) =======
  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text("Historial general de ventas", 14, 14);

      autoTable(doc, {
        startY: 20,
        head: [
          [
            "Fecha",
            "Usuario",
            "Producto",
            "Variante",
            "Precio unit.",
            "Cant.",
            "Total",
            "Stock cierre",
            "Estado",
          ],
        ],
        body: (rows || []).map((r) => {
          const unitPriceNum =
            typeof r.unitPrice === "number" ? r.unitPrice : Number(r.unitPrice || 0);
          const totalNum =
            typeof r.total === "number" ? r.total : Number(r.total || 0);
          return [
            toLocal(r.date),
            r.userName || "Desconocido",
            r.productName || "Producto eliminado",
            // Para PDF dejamos el texto compactado (si quieres, se puede hacer multilínea "Talla: X\nColor: Y")
            `${r.sizeLabel || "?"} / ${r.colorName || "?"}`,
            formatCOP(unitPriceNum),
            r.quantity ?? 0,
            formatCOP(totalNum),
            typeof r.stockAtPurchase === "number"
              ? r.stockAtPurchase
              : r.stockAtPurchase ?? "-",
            r.status || "",
          ];
        }),
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [240, 240, 240] },
      });

      const endY = doc.lastAutoTable?.finalY ?? 20;
      doc.text(`Total vendido: ${formatCOP(totals.sumTotal)}`, 14, endY + 10);

      doc.save("historial_general_ventas.pdf");
    } catch (e) {
      console.error(e);
      alert("No se pudo exportar PDF.");
    }
  };

  // ======= Export CSV (COP) =======
  const exportCSV = () => {
    const data = (rows || []).map((r) => {
      const unitPriceNum =
        typeof r.unitPrice === "number" ? r.unitPrice : Number(r.unitPrice || 0);
      const totalNum =
        typeof r.total === "number" ? r.total : Number(r.total || 0);

      return {
        fecha: toLocal(r.date),
        usuario: r.userName || "Desconocido",
        producto: r.productName || "Producto eliminado",
        variante: `${r.sizeLabel || "?"} / ${r.colorName || "?"}`,
        precio_unitario: formatCOP(unitPriceNum),
        cantidad: r.quantity ?? 0,
        total: formatCOP(totalNum),
        stock_cierre:
          typeof r.stockAtPurchase === "number"
            ? r.stockAtPurchase
            : r.stockAtPurchase ?? "",
        estado: r.status || "",
        orderId: r.orderId,
        productId: r.productId,
        userId: r.userId,
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historial");
    XLSX.writeFile(wb, "historial_general_ventas.csv");
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-3">Historial general de ventas</h2>

      <div className="mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-sm">Desde</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm">Hasta</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm">Estado</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="input"
          >
            <option value="">Todos</option>
            <option value="pendiente">pendiente</option>
            <option value="enviado">enviado</option>
            <option value="entregado">entregado</option>
            <option value="cancelado">cancelado</option>
          </select>
        </div>
        <div>
          <label className="block text-sm">Producto ID</label>
          <input
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            placeholder="ObjectId"
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm">Talla ID</label>
          <input
            value={sizeId}
            onChange={(e) => setSizeId(e.target.value)}
            placeholder="ObjectId"
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm">Color ID</label>
          <input
            value={colorId}
            onChange={(e) => setColorId(e.target.value)}
            placeholder="ObjectId"
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm">Usuario ID</label>
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="ObjectId"
            className="input"
          />
        </div>
        <button className="btn" onClick={onApplyFilters}>
          Aplicar filtros
        </button>
        <button className="btn" onClick={exportPDF}>
          Exportar PDF
        </button>
        <button className="btn" onClick={exportCSV}>
          Exportar CSV
        </button>
      </div>

      <div className="mb-2">
        <strong>Resumen:</strong>{" "}
        <span>Total vendido: {formatCOP(totals.sumTotal)}</span>{" "}
        <span className="ml-4">Unidades: {totals.sumQty}</span>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Usuario</th>
              <th>Producto</th>
              <th>Variante</th>
              <th>Precio unit.</th>
              <th>Cant.</th>
              <th>Total</th>
              <th>Stock cierre</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {(rows || []).length === 0 ? (
              <tr>
                <td colSpan="9">Sin registros.</td>
              </tr>
            ) : (
              rows.map((r, idx) => {
                const unitPriceNum =
                  typeof r.unitPrice === "number"
                    ? r.unitPrice
                    : Number(r.unitPrice || 0);
                const totalNum =
                  typeof r.total === "number" ? r.total : Number(r.total || 0);

                return (
                  <tr key={`${r.orderId}-${idx}`}>
                    <td>{toLocal(r.date)}</td>
                    <td>{r.userName || "Desconocido"}</td>
                    <td>{r.productName || "Producto eliminado"}</td>

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
                            <td>{r.sizeLabel || "?"}</td>
                            <td>{r.colorName || "?"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>

                    <td>{formatCOP(unitPriceNum)}</td>
                    <td>{r.quantity ?? 0}</td>
                    <td>{formatCOP(totalNum)}</td>
                    <td>
                      {typeof r.stockAtPurchase === "number"
                        ? r.stockAtPurchase
                        : r.stockAtPurchase ?? "-"}
                    </td>
                    <td>{r.status || ""}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminSalesHistoryPage;
