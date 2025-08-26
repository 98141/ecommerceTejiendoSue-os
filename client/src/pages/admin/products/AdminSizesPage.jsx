import AdminListManager from "../../../blocks/admin/AdminListManagesBlocks";
import api from "../../../api/client";

const AdminSizesPage = () => {
  const sizes = api("sizes");
  return (
    <div className="admin-page-container">
      <AdminListManager
        title="Tallas"
        apiEndpoint={sizes}
        fieldName="label"
      />
    </div>
  );
};

export default AdminSizesPage;
