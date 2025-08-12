import React, { useMemo, useState, useContext } from "react";
import { useProductEntryHistory } from "../../../hooks/useProductEntryHistory";
import HistoryDetailModal from "../../../components/HistoryDetailModal";
import { AuthContext } from "../../../contexts/AuthContext";
import { formatCOP } from "../../../utils/format";
import ExportMenu from "../../../components/ExportMenu";

const canExport = (role) => role === "admin";

const eventLabel = (kind) => {
  switch (kind) {
    case "CREATE": return "Creación";
    case "UPDATE_VARIANTS": return "Nuevas variantes";
    case "UPDATE_PRICE": return "Cambio de precio";
    case "UPDATE_INFO": return "Actualización";
    default: return kind || "—";
  }
};

export default function AdminProductEntryHistoryPage() {
  const { user } = useContext(AuthContext);
  const { data, total, loading, error, query, setQuery } = useProductEntryHistory({ limit: 10 });
  const [openId, setOpenId] = useState(null);

  const totalPages = useMemo(
    () => Math.ceil((total || 0) / (Number(query.limit) || 10)),
    [total, query.limit]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setQuery((q) => ({ ...q, page: 1, [name]: value }));
  };
  const handlePage = (p) => setQuery((q) => ({ ...q, page: p }));

  return (
    <div className="history-container">
      <div className="head-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <h2>Historial de productos ingresados</h2>
        {canExport(user?.role) && <ExportMenu query={query} />}
      </div>

      <div className="filters" style={{ display: "flex", flexWrap: "wrap", gap: ".5rem", marginBottom: "1rem" }}>
        <input name="search" value={query.search} onChange={handleChange} placeholder="Buscar (nombre, descripción)"/>
        <input type="date" name="from" value={query.from} onChange={handleChange} />
        <input type="date" name="to" value={query.to} onChange={handleChange} />
        <select name="limit" value={query.limit} onChange={handleChange}>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
        <select name="sort" value={query.sort} onChange={handleChange}>
          <option value="createdAt:desc">Fecha ↓</option>
          <option value="createdAt:asc">Fecha ↑</option>
          <option value="price:asc">Precio ↑</option>
          <option value="price:desc">Precio ↓</option>
        </select>
      </div>

      <div className="table-wrap" style={{ overflow: "auto" }}>
        <table className="history-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Evento</th>
              <th>Nombre</th>
              <th>Precio</th>
              <th># Variantes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6}>Cargando…</td></tr>}
            {!loading && error && <tr><td colSpan={6} className="error">{error}</td></tr>}
            {!loading && !error && data.length === 0 && <tr><td colSpan={6}>Sin resultados</td></tr>}
            {!loading && !error && data.map((row) => (
              <tr key={row._id}>
                <td>{new Date(row.createdAt).toLocaleString()}</td>
                <td>{eventLabel(row.kind)}</td>
                <td>{row.name}</td>
                <td>{formatCOP(row.price)}</td>
                <td>{row.variants?.length || 0}</td>
                <td><button onClick={() => setOpenId(row._id)}>Ver</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination" style={{ display: "flex", gap: ".5rem", justifyContent: "center", marginTop: "1rem" }}>
          <button disabled={query.page <= 1} onClick={() => handlePage(query.page - 1)}>Anterior</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} className={p === query.page ? "active" : ""} onClick={() => handlePage(p)}
              style={p === query.page ? { fontWeight: "bold", textDecoration: "underline" } : undefined}
            >{p}</button>
          ))}
          <button disabled={query.page >= totalPages} onClick={() => handlePage(query.page + 1)}>Siguiente</button>
        </div>
      )}

      <HistoryDetailModal id={openId} open={!!openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

