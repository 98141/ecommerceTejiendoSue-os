import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AdminProductManager = () => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: 0,
    stock: 0,
    imageUrl: ""
  });

  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (!user || user.role !== "admin") return navigate("/");

    fetchProducts();
  }, [token]);

  const fetchProducts = () => {
    axios.get("http://localhost:5000/api/products")
      .then(res => setProducts(res.data));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const method = editingId ? "put" : "post";
    const url = editingId
      ? `http://localhost:5000/api/products/${editingId}`
      : "http://localhost:5000/api/products";

    axios[method](url, form, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(() => {
      fetchProducts();
      setForm({ name: "", description: "", price: 0, stock: 0, imageUrl: "" });
      setEditingId(null);
    });
  };

  const handleEdit = (product) => {
    setForm(product);
    setEditingId(product._id);
  };

  const handleDelete = (id) => {
    if (confirm("¿Eliminar este producto?")) {
      axios.delete(`http://localhost:5000/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(() => fetchProducts());
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Gestión de Productos</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <input placeholder="Nombre" value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })} /><br />
        <input placeholder="Descripción" value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })} /><br />
        <input type="number" placeholder="Precio" value={form.price}
          onChange={e => setForm({ ...form, price: Number(e.target.value) })} /><br />
        <input type="number" placeholder="Stock" value={form.stock}
          onChange={e => setForm({ ...form, stock: Number(e.target.value) })} /><br />
        <input placeholder="URL de imagen" value={form.imageUrl}
          onChange={e => setForm({ ...form, imageUrl: e.target.value })} /><br />
        <button type="submit">{editingId ? "Actualizar" : "Crear"} producto</button>
      </form>

      <hr />

      <h3>Lista de productos</h3>
      {products.map(p => (
        <div key={p._id} style={{ border: "1px solid gray", marginBottom: 10, padding: 10 }}>
          <p><strong>{p.name}</strong> - ${p.price} - Stock: {p.stock}</p>
          <img src={p.imageUrl} alt={p.name} width="150" />
          <p>{p.description}</p>
          <button onClick={() => handleEdit(p)}>Editar</button>
          <button onClick={() => handleDelete(p._id)} style={{ marginLeft: 10, color: "red" }}>
            Eliminar
          </button>
        </div>
      ))}
    </div>
  );
};

export default AdminProductManager;
