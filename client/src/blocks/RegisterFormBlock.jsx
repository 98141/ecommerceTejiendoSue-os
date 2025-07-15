import { useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../contexts/ToastContext"; // ✅

const RegisterForm = () => {
  const { login } = useContext(AuthContext);
  const { showToast } = useToast(); // ✅
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/users/register", {
        name,
        email,
        password
      });

      login(res.data.token, res.data.user);
      showToast("Registro exitoso", "success"); // ✅
      res.data.user.role === "admin" ? navigate("/admin") : navigate("/");
    } catch (err) {
      const msg = err.response?.data?.error || "Error al registrar";
      showToast(msg, "error"); // ✅
    }
  };

  return (
    <div className="login-container">
      <h2>Registro</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nombre completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

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

        <button type="submit">Registrarse</button>
      </form>
      <p>¿Ya tienes cuenta? <a href="/login">Inicia sesión</a></p>
    </div>
  );
};

export default RegisterForm;
