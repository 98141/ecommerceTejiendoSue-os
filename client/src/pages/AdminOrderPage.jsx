import React, { useEffect, useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import apiUrl from "../api/apiClient";

import { AuthContext } from "../contexts/AuthContext";
import { formatCOP } from "../utils/currency";

const AdminSalesHistoryPage = () => {

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("");
  const [month, setMonth] = useState(""); // YYYY-MM

  // Error de fechas para rango manual
  const [dateError, setDateError] = useState("");

  // Ref para debounce (fechas)
  const debounceRef = useRef(null);

  // --- Helpers de fecha ---
  const validateDateRange = (fromStr, toStr) => {
    if (!fromStr || !toStr) return ""; // solo valida si ambas están
    const fromDate = new Date(fromStr);
    const toDate = new Date(toStr);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return "Fechas inválidas.";
    }
    if (toDate < fromDate) {
      return "La fecha 'Hasta' no puede ser anterior a la fecha 'Desde'.";
    }
    return "";
  };

  // Inclusivo: envía día siguiente al backend
  const normalizeToInclusive = (toStr) => {
    if (!toStr) return "";
    const d = new Date(`${toStr}T00:00:00`);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  };

  // Convierte "YYYY-MM" a inicio/fin de mes
  const monthToRange = (mStr) => {
    if (!mStr) return { from: "", toDisplay: "", toForApi: "" };
    const [yStr, mmStr] = mStr.split("-");
    const y = Number(yStr);
    const m = Number(mmStr); // 1..12
    if (!y || !m) return { from: "", toDisplay: "", toForApi: "" };

    const monthStart = `${yStr}-${mmStr}-01`;
    const lastDay = new Date(y, m, 0).getDate(); // último día del mes
    const monthEnd = `${yStr}-${mmStr}-${String(lastDay).padStart(2, "0")}`;
    const toForApi = normalizeToInclusive(monthEnd);

    return { from: monthStart, toDisplay: monthEnd, toForApi };
  };

  // --- Carga desde API ---
  const fetchData = async (opts = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (opts.from) params.append("from", opts.from);
      if (opts.to) params.append("to", opts.to);
      if (opts.status) params.append("status", opts.status);

      const res = await apiUrl.get(`/orders/sales-history?${params.toString()}`);
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      alert("Error al cargar historial general de ventas.");
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial
  useEffect(() => {
    fetchData({}); 
  }, []);

  // Validación de fechas (si NO hay mes seleccionado)
  useEffect(() => {
    if (month) {
      setDateError("");
      return;
    }
    setDateError(validateDateRange(from, to));
  }, [from, to, month]);

  // Aplica filtros ahora (prioridad mes > rango manual)
  const applyFiltersNow = (overrides = {}) => {
    const effMonth = overrides.month ?? month;

    if (effMonth) {
      const { from: mFrom, toForApi: mTo } = monthToRange(effMonth);
      fetchData({
        from: mFrom || "",
        to: mTo || "",
        status: overrides.status ?? status,
      });
      return;
    }

    const f = overrides.from ?? from;
    const t = overrides.to ?? to;
    const err = validateDateRange(f, t);
    setDateError(err);
    if (err) return;

    const toForApi = t ? normalizeToInclusive(t) : "";
    fetchData({
      from: f || "",
      to: toForApi || "",
      status: overrides.status ?? status,
    });
  };

  // Debounce para onChange de fechas
  const applyFiltersDebounced = (overrides = {}) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      applyFiltersNow(overrides);
    }, 400);
  };

  // Enter = aplicar inmediatamente
  const handleKeyDownApply = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      applyFiltersNow({});
    }
  };

  // Reset filtros
  const handleClearFilters = () => {
    setFrom("");
    setTo("");
    setStatus("");
    setMonth("");
    setDateError("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    fetchData({});
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
    if (!month && dateError) {
      alert(dateError);
      return;
    }
    try {
      const HEAD_BG = [10, 102, 194];
      const HEAD_TX = [255, 255, 255];
      const GRID = [220, 226, 235];
      const ZEBRA = [244, 248, 254];

      const doc = new jsPDF({ orientation: "landscape", unit: "mm" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.text("Historial general de ventas", 14, 12);

      const columns = [
        { header: "Fecha", dataKey: "date" },
        { header: "Usuario", dataKey: "user" },
        { header: "Producto", dataKey: "product" },
        { header: "Variante", dataKey: "variant" },
        { header: "Precio unit.", dataKey: "unitPrice" },
        { header: "Cant.", dataKey: "qty" },
        { header: "Total", dataKey: "total" },
        { header: "Stock cierre", dataKey: "stock" },
        { header: "Estado", dataKey: "status" },
      ];

      const body = (rows || []).map((r) => {
        const unitPriceNum = Number(
          typeof r.unitPrice === "number" ? r.unitPrice : r.unitPrice || 0
        );
        const totalNum = Number(
          typeof r.total === "number" ? r.total : r.total || 0
        );
        return {
          date: toLocal(r.date),
          user: r.userName || "Desconocido",
          product: r.productName || "Producto eliminado",
          variant: { size: r.sizeLabel || "?", color: r.colorName || "?" },
          unitPrice: formatCOP(unitPriceNum),
          qty: r.quantity ?? 0,
          total: formatCOP(totalNum),
          stock:
            typeof r.stockAtPurchase === "number"
              ? r.stockAtPurchase
              : r.stockAtPurchase ?? "-",
          status: r.status || "",
        };
      });

      const MARGINS = { left: 8, right: 8, top: 18 };
      const pageWidth = doc.internal.pageSize.getWidth();
      const availableWidth = pageWidth - MARGINS.left - MARGINS.right;

      const base = {
        date: 36,
        user: 40,
        product: 60,
        variant: 48,
        unitPrice: 28,
        qty: 18,
        total: 30,
        stock: 24,
        status: 28,
      };
      const sumBase = Object.values(base).reduce((a, b) => a + b, 0);
      const scale = Math.min(1, availableWidth / sumBase);
      const W = Object.fromEntries(
        Object.entries(base).map(([k, v]) => [k, Math.floor(v * scale)])
      );
      const tableFontSize = scale < 0.92 ? 8 : 9;
      const cellPadding = scale < 0.92 ? 2 : 2.5;

      autoTable(doc, {
        startY: MARGINS.top,
        columns,
        body,
        theme: "grid",
        margin: { left: MARGINS.left, right: MARGINS.right, top: MARGINS.top },
        styles: {
          fontSize: tableFontSize,
          cellPadding,
          lineColor: GRID,
          lineWidth: 0.2,
          valign: "middle",
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: HEAD_BG,
          textColor: HEAD_TX,
          lineWidth: 0,
        },
        alternateRowStyles: { fillColor: ZEBRA },
        columnStyles: {
          date: { cellWidth: W.date },
          user: { cellWidth: W.user },
          product: { cellWidth: W.product },
          variant: { cellWidth: W.variant },
          unitPrice: { cellWidth: W.unitPrice, halign: "right" },
          qty: { cellWidth: W.qty, halign: "right" },
          total: { cellWidth: W.total, halign: "right" },
          stock: { cellWidth: W.stock, halign: "right" },
          status: { cellWidth: W.status },
        },
        didParseCell: (d) => {
          if (d.section === "body" && d.column.dataKey === "variant") {
            d.cell.text = [];
          }
        },
        didDrawCell: (d) => {
          if (d.section !== "body" || d.column.dataKey !== "variant") return;

          const Doc = d.doc;
          const { x, y, width, height } = d.cell;
          const pad = 1.5;
          const ix = x + pad,
            iy = y + pad,
            iw = width - pad * 2,
            ih = height - pad * 2;
          const headerH = Math.min(6, ih * 0.35);
          const midX = ix + iw / 2;

          Doc.setDrawColor(220, 226, 235);
          Doc.setLineWidth(0.2);
          Doc.rect(ix, iy, iw, ih);

          Doc.setFillColor(235, 240, 248);
          Doc.rect(ix, iy, iw, headerH, "F");
          Doc.setDrawColor(220, 226, 235);
          Doc.line(midX, iy, midX, iy + ih);

          Doc.setTextColor(31, 45, 61);
          Doc.setFontSize(tableFontSize - 0.5);
          Doc.text("Talla", ix + 2, iy + headerH - 2);
          Doc.text("Color", midX + 2, iy + headerH - 2);

          const val = d.cell.raw || {};
          const valueY = iy + headerH + 4.5;
          Doc.setTextColor(55, 65, 81);
          Doc.setFontSize(tableFontSize);
          Doc.text(String(val.size ?? "?"), ix + 2, valueY);
          Doc.text(String(val.color ?? "?"), midX + 2, valueY);
        },
        didDrawPage: (data) => {
          const str = `Página ${
            data.pageNumber
          } de ${doc.internal.getNumberOfPages()}`;
          doc.setFontSize(9);
          doc.setTextColor(100);
          doc.text(
            str,
            data.settings.margin.left,
            doc.internal.pageSize.getHeight() - 6
          );
        },
      });

      const endY = doc.lastAutoTable?.finalY ?? MARGINS.top;
      doc.setFontSize(11);
      doc.text(`Total vendido: ${formatCOP(totals.sumTotal)}`, 14, endY + 10);

      doc.save("historial_general_ventas.pdf");
    } catch (e) {
      console.error(e);
      alert("No se pudo exportar PDF.");
    }
  };

  // ======= Export CSV (COP) =======
  const exportCSV = () => {
    if (!month && dateError) {
      alert(dateError);
      return;
    }
    const data = (rows || []).map((r) => {
      const unitPriceNum =
        typeof r.unitPrice === "number"
          ? r.unitPrice
          : Number(r.unitPrice || 0);
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

      {/* Filtros (aplican solos) */}
      <div className="mb-4 flex flex-wrap gap-3 items-end">
        {/* Mes (sincroniza Desde/Hasta) */}
        <div>
          <label className="block text-sm">Mes</label>
          <input
            type="month"
            value={month}
            onChange={(e) => {
              const m = e.target.value; // YYYY-MM
              setMonth(m);

              // Sincroniza visualmente 'Desde' y 'Hasta' con el mes
              const { from: mFrom, toDisplay: mToDisplay } = monthToRange(m);
              setFrom(mFrom);
              setTo(mToDisplay);

              // Limpia error de rango manual (no aplica con mes)
              setDateError("");

              // Aplica filtros con prioridad mes
              applyFiltersNow({ month: m });
            }}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm">Desde</label>
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setMonth(""); // usar rango manual => desactiva mes
              applyFiltersDebounced({});
            }}
            onBlur={() => applyFiltersNow({})}
            onKeyDown={handleKeyDownApply}
            className="input"
            max={to || undefined}
          />
        </div>

        <div>
          <label className="block text-sm">Hasta</label>
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setMonth(""); // usar rango manual => desactiva mes
              applyFiltersDebounced({});
            }}
            onBlur={() => applyFiltersNow({})}
            onKeyDown={handleKeyDownApply}
            className="input"
            min={from || undefined}
          />
        </div>

        <div>
          <label className="block text-sm">Estado</label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              applyFiltersNow({ status: e.target.value });
            }}
            className="input"
          >
            <option value="">Todos</option>
            <option value="pendiente">pendiente</option>
            <option value="enviado">enviado</option>
            <option value="entregado">entregado</option>
            <option value="cancelado">cancelado</option>
          </select>
        </div>

        <button
          className="btn"
          onClick={exportPDF}
          disabled={!month && !!dateError}
        >
          Exportar PDF
        </button>
        <button
          className="btn"
          onClick={exportCSV}
          disabled={!month && !!dateError}
        >
          Exportar CSV
        </button>

        {/* Eliminar filtros */}
        <button className="btn" onClick={handleClearFilters}>
          Eliminar filtros
        </button>
      </div>

      {/* Error fechas (sólo cuando se usa rango manual) */}
      {!month && dateError && <div role="alert">{dateError}</div>}

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

                    {/* Variante como mini-tabla dentro de la celda */}
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
