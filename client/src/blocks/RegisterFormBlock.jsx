import { useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useToast } from "../contexts/ToastContext";

const RegisterForm = () => {
  const { login } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = "El nombre es obligatorio.";
    if (!emailRegex.test(email)) newErrors.email = "Correo inválido.";
    if (!passwordRegex.test(password))
      newErrors.password = "Mínimo 8 caracteres, 1 número y 1 símbolo.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const res = await api.post("/users/register", { name, email, password });
      login(res.data.token, res.data.user);
      showToast("Registro exitoso. Revisa tu correo.", "info");
      navigate("/");
    } catch (err) {
      const msg = err.response?.data?.error || "Error al registrar";
      showToast(msg, "error");
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
        />
        {errors.name && <p className="form-error">{errors.name}</p>}

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && <p className="form-error">{errors.email}</p>}

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {errors.password && <p className="form-error">{errors.password}</p>}

        <button type="submit">Registrarse</button>
      </form>
      <p>¿Ya tienes cuenta? <a href="/login">Inicia sesión</a></p>
    </div>
  );
};

export default RegisterForm;
