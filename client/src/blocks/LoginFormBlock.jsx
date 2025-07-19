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

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/users/login", { email, password });

      login(res.data.token, res.data.user);
      showToast("Inicio de sesión exitoso", "success");
      res.data.user.role === "admin" ? navigate("/admin") : navigate("/");
    } catch (err) {
      const msg = err.response?.data?.error || "Error al iniciar sesión";
      showToast(msg, "error");
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

        <button type="submit">Ingresar</button>
      </form>
      <p>¿No tienes cuenta? <a href="/register">Regístrate</a></p>
    </div>
  );
};

export default LoginForm;
