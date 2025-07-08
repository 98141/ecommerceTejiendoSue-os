import { useContext, useState } from "react";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/users/login", {
        email,
        password
      });

      login(res.data.token, res.data.user);
      navigate("/");
      res.data.user.role === "admin" ? navigate("/admin") : navigate("/");
    } catch (err) {
      alert("Error al iniciar sesión: " + err.response?.data?.error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Iniciar sesión</h2>
      <input type="email" placeholder="Correo" onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Contraseña" onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Entrar</button>
    </form>
  );
};

export default LoginPage;
