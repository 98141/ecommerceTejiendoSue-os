import { useState, useEffect } from "react";
import axios from "axios";

const RegisterProductForm = ({ categories, onSubmit }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // nuevas imágenes (File[]) y sus previews (string[])
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);

  // Variantes
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [variantStock, setVariantStock] = useState("");
  const [variants, setVariants] = useState([]);

  useEffect(() => {
    fetchOptions();
    // cleanup: revocar blobs al desmontar
    return () => previews.forEach((u) => URL.revokeObjectURL(u));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOptions = async () => {
    const [resSizes, resColors] = await Promise.all([
      axios.get("http://localhost:5000/api/sizes"),
      axios.get("http://localhost:5000/api/colors"),
    ]);
    setSizes(resSizes.data);
    setColors(resColors.data);
  };

  // Agrega imágenes y genera previews
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const urls = files.map((f) => URL.createObjectURL(f));
    setImages((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...urls]);

    // permite volver a elegir los mismos archivos
    e.target.value = "";
  };

  const handleRemoveNewImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleAddVariant = () => {
    if (!selectedSize || !selectedColor || Number(variantStock) <= 0) return;

    const duplicate = variants.find(
      (v) => v.size === selectedSize && v.color === selectedColor
    );
    if (duplicate) return;

    setVariants((prev) => [
      ...prev,
      { size: selectedSize, color: selectedColor, stock: Number(variantStock) },
    ]);
    setSelectedSize("");
    setSelectedColor("");
    setVariantStock("");
  };

  const handleRemoveVariant = (index) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedCategory || Number(price) <= 0 || variants.length === 0) return;

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("categories", selectedCategory);
    formData.append("variants", JSON.stringify(variants));

    images.forEach((file) => formData.append("images", file));

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="product-form" encType="multipart/form-data">
      <input
        type="text"
        placeholder="Nombre de Producto"
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
        <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)}>
          <option value="">Talla</option>
          {sizes.map((s) => (
            <option key={s._id} value={s._id}>
              {s.label}
            </option>
          ))}
        </select>

        <select value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)}>
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

        <button type="button" className="btn-variant" onClick={handleAddVariant}>
          + Añadir Variante
        </button>
      </div>

      {variants.length > 0 && (
        <ul className="variant-list">
          {variants.map((v, i) => (
            <li key={i}>
              Talla: {sizes.find((s) => s._id === v.size)?.label} | Color:{" "}
              {colors.find((c) => c._id === v.color)?.name} | Stock: {v.stock}
              <button type="button" onClick={() => handleRemoveVariant(i)}>✖</button>
            </li>
          ))}
        </ul>
      )}

      <label>Imágenes del producto:</label>
      <input type="file" multiple accept="image/*" onChange={handleImageChange} />

      <div className="image-preview">
        {previews.map((src, i) => (
          <div key={`new-${i}`} className="preview-box">
            <img src={src} alt="preview" />
            <button type="button" onClick={() => handleRemoveNewImage(i)}>🗑</button>
          </div>
        ))}
      </div>

      <button type="submit" className="btn-save">Crear producto</button>
    </form>
  );
};

export default RegisterProductForm;
