import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";
import ProductForm from "../blocks/ProductForm";
import ConfirmModal from "../blocks/ConfirmModal";
import { useToast } from "../contexts/ToastContext";

const EditProductPage = () => {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const [product, setProduct] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/products/${id}`);
        setProduct(res.data);
      } catch {
        showToast("Error al cargar el producto", "error");
        navigate("/admin/products");
      }
    };
    fetchProduct();
  }, [id, navigate, showToast]);

  const handleUpdate = async (updatedProduct) => {
    try {
      await axios.put(`http://localhost:5000/api/products/${id}`, updatedProduct, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("Producto editado correctamente", "success");
      navigate("/admin/products");
    } catch {
      showToast("Error al editar el producto", "error");
    }
  };

  const handleCancel = () => {
    setShowConfirm(true);
  };

  const confirmCancel = () => {
    setShowConfirm(false);
    navigate("/admin/products");
  };

  const cancelModal = () => {
    setShowConfirm(false);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Editar Producto</h2>
      {product ? (
        <ProductForm
          onSubmit={handleUpdate}
          initialData={product}
          onCancel={handleCancel}
        />
      ) : (
        <p>Cargando producto...</p>
      )}

      {showConfirm && (
        <ConfirmModal
          title="Cancelar edición"
          message="¿Estás seguro que deseas cancelar? Los cambios no se guardarán."
          onConfirm={confirmCancel}
          onCancel={cancelModal}
        />
      )}
    </div>
  );
};

export default EditProductPage;
