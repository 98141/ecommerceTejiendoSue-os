import React from "react";

const OPTIONS = [
  { value: "relevance", label: "Relevancia" },
  { value: "best_sellers", label: "Más vendidos" },
  { value: "newest", label: "Novedades" },
  { value: "discount_desc", label: "Mayor descuento" },
  { value: "price_asc", label: "Precio: bajo a alto" },
  { value: "price_desc", label: "Precio: alto a bajo" },
  { value: "trending", label: "Tendencias" },
];

export default function SortBar({ sort, total, onChangeSort }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "8px 0 16px" }}>
      <span style={{ color: "#666" }}>{typeof total === "number" ? `${total} resultados` : ""}</span>
      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span>Ordenar por:</span>
        <select value={sort} onChange={(e) => onChangeSort(e.target.value)}>
          {OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
