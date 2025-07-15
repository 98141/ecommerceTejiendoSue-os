import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

const AdminEditProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const { showToast } = useToast();

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
  });

  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [preview, setPreview] = useState([]);

  // Obtener el producto a editar
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/products/${id}`);
        const { name, description, price, stock, categories, images } = res.data;
        setForm({ name, description, price, stock });
        setSelectedCategory(Array.isArray(categories) ? categories[0] : categories);
        setExistingImages(images || []);
      } catch {
        showToast("Error al cargar producto", "error");
      }
    };
    fetchProduct();
  }, [id]);

  // Obtener lista de categorías
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

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    setPreview(files.map((file) => URL.createObjectURL(file)));
  };

  const handleRemoveExistingImage = (index) => {
    const updated = [...existingImages];
    updated.splice(index, 1);
    setExistingImages(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCategory) {
      return showToast("Debes seleccionar una categoría", "error");
    }

    if (Number(form.price) <= 0) {
      return showToast("El precio debe ser mayor a 0", "error");
    }

    if (Number(form.stock) <= 0) {
      return showToast("El stock debe ser mayor a 0", "error");
    }

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("price", form.price);
      formData.append("stock", form.stock);
      formData.append("categories", selectedCategory);

      existingImages.forEach((img) => {
        formData.append("existingImages[]", img);
      });

      images.forEach((file) => {
        formData.append("images", file);
      });

      await axios.put(`http://localhost:5000/api/products/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      showToast("Producto actualizado correctamente", "success");
      navigate("/admin/products");
    } catch (err) {
      showToast("Error al actualizar producto", "error");
    }
  };

  return (
    <div className="admin-edit-form">
      <h2>Editar Producto</h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input
          type="text"
          name="name"
          placeholder="Nombre"
          value={form.name}
          onChange={handleInputChange}
          required
        />
        <textarea
          name="description"
          placeholder="Descripción"
          value={form.description}
          onChange={handleInputChange}
        />
        <input
          type="number"
          name="price"
          placeholder="Precio"
          value={form.price}
          onChange={handleInputChange}
          min="1"
          required
        />
        <input
          type="number"
          name="stock"
          placeholder="Stock"
          value={form.stock}
          onChange={handleInputChange}
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

        <label>Imágenes actuales:</label>
        <div className="image-preview">
          {existingImages.map((img, index) => (
            <div key={index} className="preview-box">
              <img src={`http://localhost:5000${img}`} alt="" />
              <button
                type="button"
                onClick={() => handleRemoveExistingImage(index)}
              >
                🗑
              </button>
            </div>
          ))}
        </div>

        <label>Agregar nuevas imágenes:</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
        />
        <div className="image-preview">
          {preview.map((img, i) => (
            <img key={i} src={img} alt="preview" />
          ))}
        </div>

        <button type="submit" className="btn-save">Guardar cambios</button>

      </form>
    </div>
  );
};

export default AdminEditProductPage;

