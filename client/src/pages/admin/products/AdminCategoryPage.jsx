import AdminListManager from "../../../blocks/admin/AdminListManagesBlocks";
import api from "../../../api/client";

const AdminCategoryPage = () => {
  const categories = api("categories");
  
  return (
    <div className="admin-page-container">
      <AdminListManager
        title="Categorías"
        apiEndpoint={categories}
        fieldName="name"
      />
    </div>
  );
};

export default AdminCategoryPage;
