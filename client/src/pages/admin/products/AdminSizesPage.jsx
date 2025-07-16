import AdminListManager from "../../../blocks/admin/AdminListManagesBlocks";

const AdminSizesPage = () => {
  return (
    <div className="admin-page-container">
      <AdminListManager
        title="Tallas"
        apiEndpoint="http://localhost:5000/api/sizes"
        fieldName="label"
      />
    </div>
  );
};

export default AdminSizesPage;
