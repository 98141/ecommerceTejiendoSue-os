import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import RegisterProductForm from "../../../blocks/admin/RegisterProductFormBlock";

const RegisterProductPage = () => {
  const { token } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/categories");
        setCategories(res.data);
      } catch {
        showToast("Error al cargar categorías", "error");
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (formData) => {
    try {
      await axios.post("http://localhost:5000/api/products", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      showToast("Producto creado correctamente", "success");
      navigate("/admin/products");
    } catch {
      showToast("Error al crear producto", "error");
    }
  };

  return (
    <div className="form-container">
      <h2>Nuevo Producto </h2>
      <RegisterProductForm categories={categories} onSubmit={handleSubmit} />
    </div>
  );
};

export default RegisterProductPage;
