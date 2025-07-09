import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";
import AdminProductRow from "../blocks/AdminProductRow";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../blocks/ConfirmModal"; // ✅ Modal visual
import { useToast } from "../contexts/ToastContext"; // ✅ Toast visual

const AdminProductPage = () => {
  const [products, setProducts] = useState([]);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const { token } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/products");
      setProducts(res.data);
    } catch {
      showToast("Error al cargar productos", "error");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const requestDelete = (product) => {
    setProductToDelete(product);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await axios.delete(`http://localhost:5000/api/products/${productToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
              onDelete={() => requestDelete(p)} 
            />
          ))}
        </tbody>
      </table>

      {showConfirm && (
        <ConfirmModal
          title="Eliminar producto"
          message={`¿Estás seguro de eliminar "${productToDelete?.name}"? Esta acción no se puede deshacer.`}
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowConfirm(false);
            setProductToDelete(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminProductPage;
