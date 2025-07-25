import { useEffect, useState } from "react";
import axios from "axios";
import { FaTimesCircle, FaPlusCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const EditProductForm = ({ productId, token, onSuccess, showToast }) => {
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);

  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
  });
  const [selectedCategory, setSelectedCategory] = useState("");
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [preview, setPreview] = useState([]);

  const [variants, setVariants] = useState([]);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [variantStock, setVariantStock] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [productRes, categoriesRes, sizesRes, colorsRes] =
        await Promise.all([
          axios.get(`http://localhost:5000/api/products/${productId}`),
          axios.get("http://localhost:5000/api/categories"),
          axios.get("http://localhost:5000/api/sizes"),
          axios.get("http://localhost:5000/api/colors"),
        ]);

      const { name, description, price, categories, images, variants } =
        productRes.data;
      setForm({ name, description, price });
      setSelectedCategory(
        Array.isArray(categories) ? categories[0] : categories
      );
      setExistingImages(images || []);
      setVariants(variants || []);
      setCategories(categoriesRes.data);
      setSizes(sizesRes.data);
      setColors(colorsRes.data);
    } catch {
      showToast("Error al cargar datos", "error");
    }
  };

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

  const handleAddVariant = () => {
    if (!selectedSize || !selectedColor || Number(variantStock) <= 0) return;

    const duplicate = variants.find(
      (v) => v.size === selectedSize && v.color === selectedColor
    );
    if (duplicate) return;

    setVariants([
      ...variants,
      { size: selectedSize, color: selectedColor, stock: Number(variantStock) },
    ]);
    setSelectedSize("");
    setSelectedColor("");
    setVariantStock("");
  };

  const handleRemoveVariant = (index) => {
    const updated = [...variants];
    updated.splice(index, 1);
    setVariants(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCategory || Number(form.price) <= 0 || variants.length === 0) {
      return showToast("Completa todos los campos requeridos", "error");
    }

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("price", form.price);
      formData.append("categories", selectedCategory);
      formData.append("variants", JSON.stringify(variants));
      existingImages.forEach((img) => {
        formData.append("existingImages[]", img);
      });
      images.forEach((file) => {
        formData.append("images", file);
      });

      await axios.put(
        `http://localhost:5000/api/products/${productId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      showToast("Producto actualizado correctamente", "success");
      onSuccess();
    } catch {
      showToast("Error al actualizar producto", "error");
    }
  };

  const handleCancel = () => {
    // Si necesitas confirmar con el usuario:
    // if (window.confirm("¿Estás seguro de cancelar los cambios?")) {
    navigate("/admin/products");
    // }
  };

  return (
    <div className="form-container">
      <h2>Editar Producto</h2>
      <form
        onSubmit={handleSubmit}
        className="product-form"
        encType="multipart/form-data"
      >
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

        <div className="variant-selector">
          <select
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value)}
          >
            <option value="">Talla</option>
            {sizes.map((s) => (
              <option key={s._id} value={s._id}>
                {s.label}
              </option>
            ))}
          </select>

          <select
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
          >
            <option value="">Color</option>
            {colors.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Stock"
            value={variantStock}
            onChange={(e) => setVariantStock(e.target.value)}
            min="1"
          />

          <button
            type="button"
            className="btn-variant"
            onClick={handleAddVariant}
          >
            + Añadir Variante
          </button>
        </div>

        {variants.length > 0 && (
          <ul className="variant-list">
            {variants.map((v, i) => (
              <li key={i}>
                Talla: {sizes.find((s) => s._id === v.size)?.label} | Color:{" "}
                {colors.find((c) => c._id === v.color)?.name} | Stock: {v.stock}
                <button type="button" onClick={() => handleRemoveVariant(i)}>
                  ✖
                </button>
              </li>
            ))}
          </ul>
        )}

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
        <div>
          <button type="submit" className="btn-save">
            <FaPlusCircle style={{ marginRight: "6px" }} />
            Guardar cambios
          </button>
          <button
            onClick={handleCancel}
            title="Cancelar cambios y volver"
            style={{ backgroundColor: "#ccc", color: "#333" }}
          >
            <FaTimesCircle style={{ marginRight: "6px" }} />
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProductForm;
