import React from "react";

export default function LoaderSombrero({ visible, pending = 0, label = "Cargando…" }) {
  if (!visible) return null;
  return (
    <div className="loader-overlay" role="status" aria-live="polite" aria-busy="true" aria-label="Cargando contenido">
      <div className="sombrero" aria-hidden="true">
        <div className="copa"></div>
        <div className="ala"></div>
        <div className="fibra fibra-1"></div>
        <div className="fibra fibra-2"></div>
      </div>
      <div className="loader-text">
        {label} {pending > 1 ? `(${pending})` : ""}
      </div>
    </div>
  );
}
