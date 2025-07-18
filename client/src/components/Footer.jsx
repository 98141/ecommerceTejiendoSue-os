import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Footer = () => {
  const [visits, setVisits] = useState(0);

  useEffect(() => {
    const increaseVisitIfFirst = async () => {
      try {
        if (!sessionStorage.getItem("visited")) {
          await axios.post(`${API_URL}/api/visits/increment`);
          sessionStorage.setItem("visited", "true");
        }

        const res = await axios.get(`${API_URL}/api/visits`);
        setVisits(res.data.count);
      } catch (err) {
        console.error("Error con contador de visitas:", err);
      }
    };

    increaseVisitIfFirst();
  }, []);

  return (
    <footer style={{ textAlign: "center", padding: "1rem", marginTop: "2rem", background: "#f1f1f1" }}>
      <p>© 2025 Mi Tejiendo Sueños</p>
      <p>Visitas totales: {visits}</p>
    </footer>
  );
};

export default Footer;

