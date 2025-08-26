import { useState } from "react";

import apiUrl from "../api/apiClient"

import { useToast } from "../contexts/ToastContext";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiUrl.post("users/forgot-password", { email });
      showToast("Revisa tu correo para restablecer tu contraseña", "info");
    } catch (err) {
      const msg = err.response?.data?.error || "Error al solicitar restablecimiento";
      showToast(msg, "error");
    }
  };

  return (
    <div className="login-container">
      <h2>¿Olvidaste tu contraseña?</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Enviar enlace</button>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;
