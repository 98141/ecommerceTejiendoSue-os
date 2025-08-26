import React, { useEffect, useState, useContext } from "react";

import apiUrl from "../api/apiClient";

import { AuthContext } from "../contexts/AuthContext";
import { formatCOP } from "../utils/format";

const eventLabel = (kind) => {
  switch (kind) {
    case "CREATE": return "Creación";
    case "UPDATE_VARIANTS": return "Nuevas variantes";
    case "UPDATE_PRICE": return "Cambio de precio";
    case "UPDATE_INFO": return "Actualización";
    default: return kind || "—";
  }
};

export default function HistoryDetailModal({ id, open, onClose }) {
  const { token } = useContext(AuthContext);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar detalle
  useEffect(() => {
    if (!open || !id) return;

    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiUrl.get(
          `productsHistory/history/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setItem(response.data);
      } catch (err) {
        setError("Error al cargar los detalles del historial");
        console.error("Detalle de error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [open, id, token]);

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const getCategoryLabel = () => {
    if (!item) return "—";
    if (Array.isArray(item.categories)) {
      return item.categories
        .map((c) => c?.name || "")
        .filter(Boolean)
        .join(", ") || "—";
    }
    return item.categories?.name || (typeof item.categories === "string" ? item.categories : "—");
  };

  const handleRetry = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await apiUrl.get(
        `productsHistory/history/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setItem(response.data);
    } catch (err) {
      setError("Error al cargar los detalles del historial" + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="history-detail-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-detail-title"
      onClick={onClose}
    >
      <div
        className="history-detail-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 id="history-detail-title">Detalle de ingreso</h3>
          <button
            className="close-btn"
            onClick={onClose}
            aria-label="Cerrar modal"
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-indicator">
              <div className="loading-spinner" />
              <p>Cargando detalles...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <button className="btn btn--primary btn-sm" onClick={handleRetry}>
                Reintentar
              </button>
            </div>
          ) : item ? (
            <>
              <div className="grid">
                <div className="grid-item">
                  <strong>Fecha</strong>
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                </div>

                <div className="grid-item">
                  <strong>Evento</strong>
                  <span>{eventLabel(item.kind)}</span>
                </div>

                <div className="grid-item">
                  <strong>Nombre</strong>
                  <span>{item.name || "—"}</span>
                </div>

                <div className="grid-item">
                  <strong>Precio</strong>
                  <span>{formatCOP(item.price)}</span>
                </div>

                <div className="grid-item">
                  <strong>Categoría</strong>
                  <span>{getCategoryLabel()}</span>
                </div>

                {item.note && (
                  <div className="grid-item grid-span">
                    <strong>Nota</strong>
                    <span>{item.note}</span>
                  </div>
                )}
              </div>

              <div className="variants-section">
                <h4>Variantes</h4>
                <div className="table-wrap">
                  <table className="variants-table">
                    <thead>
                      <tr>
                        <th>Talla</th>
                        <th>Color</th>
                        <th>Stock inicial</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.variants && item.variants.length > 0 ? (
                        item.variants.map((v, idx) => (
                          <tr key={idx}>
                            <td>{v.size?.label || "—"}</td>
                            <td>{v.color?.name || "—"}</td>
                            <td>{v.initialStock ?? 0}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="no-variants-message">
                            No hay variantes registradas
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
