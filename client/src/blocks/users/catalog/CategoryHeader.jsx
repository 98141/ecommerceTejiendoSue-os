import React from "react";

export default function CategoryHeader({ category, slug, total, q }) {
  const title = category?.name || (slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : "Tienda");
  const desc = category?.description || (q ? `Resultados para "${q}"` : "Explora nuestro catálogo");
  return (
    <header style={{ marginBottom: 12 }}>
      <h2 style={{ margin: 0 }}>{title}</h2>
      <p style={{ margin: "4px 0 0", color: "#555" }}>{desc} {typeof total === "number" ? `· ${total} productos` : ""}</p>
    </header>
  );
}
