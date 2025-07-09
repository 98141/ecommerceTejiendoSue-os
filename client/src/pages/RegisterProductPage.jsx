import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import ProductForm from "../blocks/ProductForm";
import ConfirmModal from "../blocks/ConfirmModal";

const NewProductPage = () => {
  const { token } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [showConfirm, setShowConfirm] = useState(false);

  const handleAdd = async (product) => {
    try {
      await axios.post("http://localhost:5000/api/products", product, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("Producto agregado exitosamente", "success");
      navigate("/admin/products");
    } catch (err) {
      showToast("Error al guardar el producto" + (err.response?.data?.error || ""), "error");
    }
  };

  const handleCancel = () => {
    setShowConfirm(true); // Mostrar el modal
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
      <h2>Agregar nuevo producto</h2>
      <ProductForm onSubmit={handleAdd} onCancel={handleCancel} />

      {showConfirm && (
        <ConfirmModal
          title="Cancelar registro"
          message="¿Estás seguro de cancelar el registro del producto?"
          onConfirm={confirmCancel}
          onCancel={cancelModal}
        />
      )}
    </div>
  );
};

export default NewProductPage;
