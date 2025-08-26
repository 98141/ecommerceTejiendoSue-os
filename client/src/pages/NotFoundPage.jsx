import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div style={{ padding: "50px", textAlign: "center" }}>
      <h1 style={{ fontSize: "3rem", color: "#dc2626" }}>404</h1>
      <p style={{ fontSize: "1.5rem", margin: "20px 0" }}>
        Página no encontrada
      </p>
      <Link to="/" className="btn-save">Volver al inicio</Link>
    </div>
  );
};

export default NotFoundPage;
