import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";
import AdminProductRow from "../blocks/AdminProductRow";
import { useNavigate } from "react-router-dom";

const AdminProductPage = () => {
  const [products, setProducts] = useState([]);
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/products");
      setProducts(res.data);
    } catch {
      alert("Error al cargar productos");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este producto?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProducts();
    } catch {
      alert("Error al eliminar");
    }
  };

  const handleEdit = (product) => {
    navigate(`/admin/products/edit/${product._id}`);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Administrar Productos</h2>

      <button
        onClick={() => navigate("/admin/products/new")}
        className="btn-save"
        style={{ marginBottom: "20px" }}
      >
        + Agregar nuevo producto
      </button>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <AdminProductRow
              key={p._id}
              product={p}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminProductPage;
