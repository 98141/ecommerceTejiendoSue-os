import React from "react";

export default function LoaderOverlay({ visible, pending = 0, label = "Cargando…" }) {
  if (!visible) return null;

  const textId = "loader-overlay-text";

  return (
    <div
      className="loader-overlay"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-describedby={textId}
    >
      <div className="sombrero" aria-hidden="true">
        <div className="copa"></div>
        <div className="ala"></div>
        <div className="fibra fibra-1"></div>
        <div className="fibra fibra-2"></div>
      </div>

      <div id={textId} className="loader-text">
        {label} {pending > 1 ? `(${pending})` : ""}
      </div>
    </div>
  );
}
