import { useState } from "react";
import api from "../api/apiClient";

function buildQueryString(query) {
  const params = { ...query };
  Object.keys(params).forEach((k) => {
    if (params[k] === "" || params[k] == null) delete params[k];
  });
  return new URLSearchParams(params).toString();
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ExportMenu({ query }) {
  const [downloading, setDownloading] = useState(false);

  const handleExport = async (format) => {
    try {
      setDownloading(true);

      const qs = buildQueryString(query);
      const url = `/productsHistory/history/export?${qs}&format=${format}`;

      const { data } = await api.get(url, {
        responseType: "blob",
      });

      const now = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      const filename = `historial_${now}.${format === "pdf" ? "pdf" : "csv"}`;
      saveBlob(data, filename);
    } catch (e) {
      console.error("Error exportando:", e);
      alert(e?.response?.data?.error || "No se pudo exportar.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="export-menu" style={{ display: "flex", gap: ".5rem" }}>
      <button onClick={() => handleExport("csv")} disabled={downloading}>
        {downloading ? "Generando…" : "Exportar CSV"}
      </button>
      <button onClick={() => handleExport("pdf")} disabled={downloading}>
        {downloading ? "Generando…" : "Exportar PDF"}
      </button>
    </div>
  );
}
