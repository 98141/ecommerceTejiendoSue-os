import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useToast } from "../contexts/ToastContext";

const EmailVerificationPage = () => {
  const { token } = useParams();
  const { showToast } = useToast();
  const [status, setStatus] = useState("Verificando...");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/users/verify/${token}`);
        showToast(res.data.message, "success");
        setStatus("✅ Cuenta verificada correctamente. Ya puedes iniciar sesión.");
      } catch (err) {
        const msg = err.response?.data?.error || "Error al verificar correo.";
        showToast(msg, "error");
        setStatus("❌ El enlace es inválido o ha expirado.");
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="container">
      <h2>{status}</h2>
      <a href="/login">Ir a login</a>
    </div>
  );
};

export default EmailVerificationPage;
