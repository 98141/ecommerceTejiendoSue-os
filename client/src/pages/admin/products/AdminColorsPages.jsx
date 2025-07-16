import AdminListManager from "../../../blocks/admin/AdminListManagesBlocks";

const AdminColorsPage = () => {
  return (
    <div className="admin-page-container">
      <AdminListManager
        title="Colores"
        apiEndpoint="http://localhost:5000/api/colors"
        fieldName="name"
      />
    </div>
  );
};

export default AdminColorsPage;
