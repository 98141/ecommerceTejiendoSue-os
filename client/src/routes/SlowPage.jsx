import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { cancelAllActiveRequests } from "../api/apiClient";

export default function SlowPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Cancelar cualquier request colgada al aterrizar aquí
    cancelAllActiveRequests();
  }, []);

  const backHome = () => navigate("/", { replace: false });
  const retry = () => navigate(-1);

  const url = state?.url || "operación";
  const elapsed = state?.elapsed ? Math.round(state.elapsed / 1000) : 15;

  return (
    <main style={{ padding: "2rem 1rem", maxWidth: 720, margin: "0 auto" }}>
      <h1>Conexión lenta</h1>
      <p>
        La carga para <strong>{url}</strong> superó {elapsed}s. Puede ser una
        conexión inestable o el servicio ocupado.
      </p>
      <ul>
        <li>Revisa tu conexión a Internet.</li>
        <li>Intenta nuevamente en unos segundos.</li>
        <li>Si persiste, contáctanos por soporte.</li>
      </ul>
      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <button onClick={retry}>Reintentar</button>
        <button onClick={backHome}>Ir al inicio</button>
      </div>
    </main>
  );
}
