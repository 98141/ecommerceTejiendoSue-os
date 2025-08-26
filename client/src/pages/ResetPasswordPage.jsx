import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import apiUrl from "../api/apiClient";

import { useToast } from "../contexts/ToastContext";

const ResetPasswordPage = () => {
  const { token } = useParams();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Expresión regular para contraseña segura
  const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!passwordRegex.test(password)) {
      setError("La contraseña debe tener mínimo 8 caracteres, al menos 1 número y 1 símbolo.");
      return;
    }

    try {
      await apiUrl.post(`users/reset-password/${token}`, { password });
      showToast("Contraseña actualizada con éxito", "success");
      navigate("/login");
    } catch (err) {
      const msg = err.response?.data?.error || "Error al restablecer la contraseña";
      showToast(msg, "error");
    }
  };

  return (
    <div className="login-container">
      <h2>Restablecer contraseña</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Nueva contraseña"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (!passwordRegex.test(e.target.value)) {
              setError("Debe tener mínimo 8 caracteres, 1 número y 1 símbolo.");
            } else {
              setError("");
            }
          }}
          required
        />
        {error && <p style={{ color: "red", fontSize: "0.9rem" }}>{error}</p>}

        <button type="submit" disabled={!!error}>Guardar nueva contraseña</button>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
