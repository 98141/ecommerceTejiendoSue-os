import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

import api from "../api/apiClient";

import { useToast } from "../contexts/ToastContext";

const EmailVerificationPage = () => {
  const { token } = useParams();
  const { showToast } = useToast();
  const [status, setStatus] = useState("Verificando...");
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const verifyEmail = async () => {
      if (!token) {
        setStatus("❌ Token inválido.");
        return;
      }
      try {
        const res = await api.get(`/users/verify/${token}`); // usa instancia con whitelist
        if (!mounted) return;
        showToast(res.data?.message || "Cuenta verificada", "success");
        setStatus(
          "✅ Cuenta verificada correctamente. Ya puedes iniciar sesión."
        );
        // Opcional: redirigir al login automáticamente
        // setTimeout(() => navigate("/login"), 2500);
      } catch (err) {
        if (!mounted) return;
        const msg = err.response?.data?.error || "Error al verificar correo.";
        showToast(msg, "error");
        setStatus("❌ El enlace es inválido o ha expirado.");
      }
    };

    verifyEmail();
    return () => {
      mounted = false;
    };
  }, [token, showToast, navigate]);

  return (
    <div className="container">
      <h2>{status}</h2>
      <Link to="/login">Ir a login</Link>
    </div>
  );
};

export default EmailVerificationPage;
