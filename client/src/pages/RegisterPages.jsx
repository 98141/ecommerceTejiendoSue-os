import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/users/register", form);
      alert("Registro exitoso. Ahora inicia sesión.");
      navigate("/login");
    } catch (err) {
      alert("Error al registrar: " + err.response?.data?.error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Registro</h2>
      <input placeholder="Nombre" onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input type="email" placeholder="Correo" onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input type="password" placeholder="Contraseña" onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <button type="submit">Registrarme</button>
    </form>
  );
};

export default RegisterPage;
