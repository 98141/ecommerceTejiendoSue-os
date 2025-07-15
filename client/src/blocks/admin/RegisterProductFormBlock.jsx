import { useState } from "react";

const RegisterProductForm = ({ categories, onSubmit }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [images, setImages] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  const handleImageChange = (e) => {
    setImages(Array.from(e.target.files));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedCategory || Number(price) <= 0 || Number(stock) <= 0) return;

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("stock", stock);
    formData.append("categories", selectedCategory);
    images.forEach((file) => formData.append("images", file));

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="product-form">
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

      <button type="submit" className="btn-save">
        Crear producto
      </button>
    </form>
  );
};

export default RegisterProductForm;
