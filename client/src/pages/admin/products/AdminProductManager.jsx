import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../../contexts/AuthContext";
import ConfirmModal from "../../../blocks/ConfirmModalBlock";
import { useToast } from "../../../contexts/ToastContext";
import { useNavigate } from "react-router-dom";

const AdminProductPage = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [productToDelete, setProductToDelete] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const { token } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    const filtered = products.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        (Array.isArray(p.categories) &&
          p.categories.some((cat) => cat.toLowerCase().includes(lower)))
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/products");
      setProducts(res.data);
    } catch {
      showToast("Error al cargar productos", "error");
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      await axios.delete(
        `http://localhost:5000/api/products/${productToDelete._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      showToast("Producto eliminado correctamente", "success");
      fetchProducts();
    } catch {
      showToast("Error al eliminar el producto", "error");
    } finally {
      setShowConfirm(false);
      setProductToDelete(null);
    }
  };

  const handleEdit = (product) => {
    navigate(`/admin/products/edit/${product._id}`);
  };

  return (
    <div className="admin-products">
      <div className="header">
        <h2>Administrar Productos</h2>
        <button
          onClick={() => navigate("/admin/products/new")}
          className="btn-add"
        >
          + Agregar producto
        </button>
        <button
          onClick={() => navigate("/admin/categories")}
          className="btn-add"
        >
          + Categoria
        </button>
      </div>

      <input
        type="text"
        placeholder="Buscar por nombre o categoría..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />

      <table className="product-table">
        <thead>
          <tr>
            <th>Imagen</th>
            <th>Nombre</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Categorías</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map((p) => (
            <tr key={p._id}>
              <td>
                <img
                  src={`http://localhost:5000${p.images?.[0]}`}
                  alt={p.name}
                  className="thumbnail"
                />
              </td>
              <td>{p.name}</td>
              <td>${p.price}</td>
              <td>{p.stock}</td>
              <td>
                {p.category?.name ||
                  (Array.isArray(p.categories)
                    ? p.categories
                        .map((cat) =>
                          typeof cat === "object" ? cat.name : cat
                        )
                        .join(", ")
                    : "Sin categoría")}
              </td>
              <td>
                <button className="btn-edit" onClick={() => handleEdit(p)}>
                  Editar
                </button>
                <button
                  className="btn-delete"
                  onClick={() => {
                    setProductToDelete(p);
                    setShowConfirm(true);
                  }}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showConfirm && (
        <ConfirmModal
          title="Eliminar producto"
          message={`¿Estás seguro de eliminar "${productToDelete?.name}"?`}
          onConfirm={handleDelete}
          onCancel={() => {
            setProductToDelete(null);
            setShowConfirm(false);
          }}
        />
      )}
    </div>
  );
};

export default AdminProductPage;
