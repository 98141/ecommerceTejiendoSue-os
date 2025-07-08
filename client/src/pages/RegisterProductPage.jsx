import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import ProductForm from "../blocks/ProductForm";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const RegisterProductPage = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleAdd = async (newProduct) => {
    try {
      await axios.post("http://localhost:5000/api/products", newProduct, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Producto agregado con éxito");
      navigate("/admin/products");
    } catch {
      alert("Error al guardar el producto");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Registrar Nuevo Producto</h2>
      <ProductForm onSubmit={handleAdd} />
    </div>
  );
};

export default RegisterProductPage;
