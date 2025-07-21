import { useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useToast } from "../contexts/ToastContext";

const LoginForm = () => {
  const { login } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return; // Evita múltiples envíos
    setLoading(true);

    try {
      const res = await api.post("/users/login", { email, password });
      login(res.data.token, res.data.user);

      showToast("Inicio de sesión exitoso", "success");
      res.data.user.role === "admin" ? navigate("/admin") : navigate("/");
    } catch (err) {
      let msg = "Error al iniciar sesión";

      // Manejo específico del error 429
      if (err.response?.status === 429) {
        msg = "Demasiados intentos fallidos. Intenta de nuevo más tarde.";
      } else if (err.response?.data?.error) {
        msg = err.response.data.error;
      }

      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Iniciar sesión</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
      <p>
        ¿No tienes cuenta? <a href="/register">Regístrate</a>
      </p>
    </div>
  );
};

export default LoginForm;
