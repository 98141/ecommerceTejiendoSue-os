import React, { useEffect, useState } from "react";
import axios from "axios";

const Footer = () => {
  const [visits, setVisits] = useState(0);

  useEffect(() => {
    // Solo enviar la visita si no se ha contado esta sesión
    if (!sessionStorage.getItem("visited")) {
      axios.post("http://localhost:5000/api/visits/increment")
        .then(() => {
          sessionStorage.setItem("visited", "true");
        })
        .catch((err) => console.error("Error al incrementar visitas:", err));
    }

    // Obtener número de visitas actual
    axios.get("http://localhost:5000/api/visits/count")
      .then((res) => {
        setVisits(res.data.count);
      })
      .catch((err) => {
        console.error("Error al obtener visitas:", err);
      });
  }, []);

  return (
    <footer style={{ textAlign: "center", padding: "1rem", marginTop: "2rem", background: "#f1f1f1" }}>
      <p>© 2025 Mi E-commerce</p>
      <p>Visitas totales: {visits}</p>
    </footer>
  );
};

export default Footer;

