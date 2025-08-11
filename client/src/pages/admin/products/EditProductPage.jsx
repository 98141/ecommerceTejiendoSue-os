import { useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import AdminEditProductForm from "../../../blocks/admin/AdminEditProductForm";

const AdminEditProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const { showToast } = useToast();

  const handleSuccess = () => navigate("/admin/products");

  return (
    <AdminEditProductForm
      productId={id}
      token={token}
      onSuccess={handleSuccess}
      showToast={showToast}
    />
  );
};

export default AdminEditProductPage;
