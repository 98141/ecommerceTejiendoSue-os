import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

const AdminAddProduct = () => {
  const { token } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(""); // ahora string vacío
  const [stock, setStock] = useState(""); // ahora string vacío
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

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

  const handleImageChange = (e) => {
    setImages(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCategory) {
      return showToast("Debes seleccionar una categoría", "error");
    }

    if (Number(price) <= 0) {
      return showToast("El precio debe ser mayor a 0", "error");
    }

    if (Number(stock) <= 0) {
      return showToast("El stock debe ser mayor a 0", "error");
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("stock", stock);
    formData.append("categories", selectedCategory);

    images.forEach((file) => formData.append("images", file));

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
      <h2>Nuevo Producto</h2>
      <form onSubmit={handleSubmit} className="product-form">
        <input
          type="text"
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <textarea
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          type="number"
          placeholder="Precio"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          min="1"
          required
        />

        <input
          type="number"
          placeholder="Stock"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          min="1"
          required
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          required
        >
          <option value="">Selecciona una categoría</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageChange}
        />

        <button type="submit" className="btn-save">Crear producto</button>
      </form>
    </div>
  );
};

export default AdminAddProduct;
