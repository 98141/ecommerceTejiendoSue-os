import React from "react";
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
  const [expandedProductId, setExpandedProductId] = useState(null); // ✅ solo un producto expandido

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
        (Array.isArray(p.categories)
          ? p.categories.some((cat) =>
              typeof cat === "object"
                ? cat.name.toLowerCase().includes(lower)
                : cat.toLowerCase().includes(lower)
            )
          : typeof p.categories === "object"
          ? p.categories.name.toLowerCase().includes(lower)
          : false)
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

  const getTotalStock = (variants) => {
    if (!Array.isArray(variants)) return 0;
    return variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  };

  const toggleRow = (id) => {
    setExpandedProductId((prevId) => (prevId === id ? null : id));
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
          + Categorías
        </button>
        <button onClick={() => navigate("/admin/sizes")} className="btn-add">
          + Tallas
        </button>
        <button onClick={() => navigate("/admin/colors")} className="btn-add">
          + Colores
        </button>
         <button onClick={() => navigate("/admin/historial")} className="btn-add">
          + Historial
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
            <th>Stock Total</th>
            <th>Categorías</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map((p) => (
            <React.Fragment key={p._id}>
              <tr>
                <td>
                  <img
                    src={`http://localhost:5000${p.images?.[0]}`}
                    alt={p.name}
                    className="thumbnail"
                  />
                </td>
                <td>{p.name}</td>
                <td>${p.price}</td>
                <td>{getTotalStock(p.variants)}</td>
                <td>
                  {Array.isArray(p.categories)
                    ? p.categories
                        .map((cat) =>
                          typeof cat === "object" ? cat.name : cat
                        )
                        .join(", ")
                    : typeof p.categories === "object"
                    ? p.categories.name
                    : "Sin categoría"}
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
                  <button
                    className="btn-variants"
                    onClick={() => toggleRow(p._id)}
                    style={{ marginTop: "4px", backgroundColor: "#e3e3e3" }}
                  >
                    {expandedProductId === p._id
                      ? "Ocultar variantes"
                      : "Ver variantes"}
                  </button>
                  <button
                    className="btn-history"
                    onClick={() => navigate(`/admin/products/${p._id}/history`)}
                    style={{ marginTop: "4px", backgroundColor: "#d9edf7" }}
                  >
                    Historial
                  </button>
                </td>
              </tr>

              {expandedProductId === p._id && p.variants?.length > 0 && (
                <tr key={`expanded-${p._id}`}>
                  <td colSpan="6">
                    <table className="variant-table">
                      <thead>
                        <tr>
                          <th>Talla</th>
                          <th>Color</th>
                          <th>Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {p.variants.map((v, i) => (
                          <tr key={v._id || i}>
                            <td>{v.size?.label || "—"}</td>
                            <td>{v.color?.name || "—"}</td>
                            <td>{v.stock}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </React.Fragment>
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
