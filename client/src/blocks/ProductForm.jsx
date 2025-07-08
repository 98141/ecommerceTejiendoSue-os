import { useState, useEffect } from "react";

const ProductForm = ({ onSubmit, onCancel, initialData }) => {
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    imageUrl: ""
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        description: initialData.description || "",
        price: initialData.price || "",
        stock: initialData.stock || "",
        imageUrl: initialData.imageUrl || ""
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { name, description, price, stock, imageUrl } = form;
    if (!name || !description || !price || !stock || !imageUrl) {
      return alert("Todos los campos son obligatorios");
    }
    onSubmit({
      name,
      description,
      price: Number(price),
      stock: Number(stock),
      imageUrl
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <input
        type="text"
        name="name"
        placeholder="Nombre"
        value={form.name}
        onChange={handleChange}
        className="form-input"
      />
      <input
        type="text"
        name="description"
        placeholder="Descripción"
        value={form.description}
        onChange={handleChange}
        className="form-input"
      />
      <input
        type="number"
        name="price"
        placeholder="Precio"
        value={form.price}
        onChange={handleChange}
        className="form-input"
      />
      <input
        type="number"
        name="stock"
        placeholder="Stock"
        value={form.stock}
        onChange={handleChange}
        className="form-input"
      />
      <input
        type="text"
        name="imageUrl"
        placeholder="URL de la imagen"
        value={form.imageUrl}
        onChange={handleChange}
        className="form-input"
      />

      <div className="mt-2">
        <button type="submit" className="btn-save mr-2">Guardar</button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-delete">
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
};

export default ProductForm;
