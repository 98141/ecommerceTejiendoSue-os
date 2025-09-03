import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../api/apiClient";
import { useToast } from "../../contexts/ToastContext";

const useDebounced = (value, ms = 400) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
};

export default function UsersAdminPage() {
  const { showToast } = useToast();

  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const [verified, setVerified] = useState("all");
  const [sort, setSort] = useState("createdAt:desc");
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const debQ = useDebounced(q, 400);

  const params = useMemo(() => {
    const p = { page, limit, sort };
    if (debQ.trim()) p.q = debQ.trim();
    if (role !== "all") p.role = role;
    if (verified !== "all") p.verified = verified;
    return p;
  }, [page, limit, sort, debQ, role, verified]);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    api.get("/admin/users", { params })
      .then(({ data }) => {
        if (cancel) return;
        setItems(Array.isArray(data?.items) ? data.items : []);
        setTotal(Number(data?.total || 0));
      })
      .catch(() => {
        if (cancel) return;
        setItems([]);
        setTotal(0);
        showToast("No se pudo cargar usuarios", "error");
      })
      .finally(() => !cancel && setLoading(false));
    return () => { cancel = true; };
  }, [params, showToast]);

  // Reiniciar a página 1 cuando cambian filtros "fuertes"
  useEffect(() => { setPage(1); }, [debQ, role, verified, limit, sort]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <section className="admin-users">
      <h1>Usuarios</h1>

      <div className="admin-users__filters">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o email…"
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="all">Rol: todos</option>
          <option value="user">Usuario</option>
          <option value="admin">Administrador</option>
        </select>
        <select value={verified} onChange={(e) => setVerified(e.target.value)}>
          <option value="all">Verificación: todos</option>
          <option value="1">Verificados</option>
          <option value="0">No verificados</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="createdAt:desc">Recientes primero</option>
          <option value="createdAt:asc">Antiguos primero</option>
          <option value="name:asc">Nombre A→Z</option>
          <option value="name:desc">Nombre Z→A</option>
          <option value="email:asc">Email A→Z</option>
          <option value="email:desc">Email Z→A</option>
        </select>
        <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
          <option value={10}>10 / pág</option>
          <option value={20}>20 / pág</option>
          <option value={50}>50 / pág</option>
        </select>
      </div>

      <div className="admin-users__summary">
        {loading ? "Cargando…" : `Total: ${total} usuarios`}
      </div>

      <div className="admin-users__tableWrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Verificado</th>
              <th>Creado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}>Cargando…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5}>Sin resultados</td></tr>
            ) : (
              items.map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === "admin" ? "badge--admin" : "badge--user"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    {u.isVerified ? (
                      <span className="badge badge--ok">Sí</span>
                    ) : (
                      <span className="badge badge--warn">No</span>
                    )}
                  </td>
                  <td>{u.createdAt ? new Date(u.createdAt).toLocaleString() : "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-users__pager">
        <button
          className="btn btn--ghost"
          disabled={page <= 1 || loading}
          onClick={() => setPage(p => Math.max(1, p - 1))}
        >
          ← Anterior
        </button>
        <span>Pág. {page} / {totalPages}</span>
        <button
          className="btn btn--ghost"
          disabled={page >= totalPages || loading}
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
        >
          Siguiente →
        </button>
      </div>
    </section>
  );
}
