import AdminListManager from "../../../blocks/admin/AdminListManagesBlocks";

const AdminCategoryPage = () => {
  return (
    <div className="admin-page-container">
      <AdminListManager
        title="Categorías"
        apiEndpoint="http://localhost:5000/api/categories"
        fieldName="name"
      />
    </div>
  );
};

export default AdminCategoryPage;
