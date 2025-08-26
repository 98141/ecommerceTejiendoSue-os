import AdminListManager from "../../../blocks/admin/AdminListManagesBlocks";
import api from "../../../api/client";

const AdminColorsPage = () => {
  const colors = api("colors");

  return (
    <div className="admin-page-container">
      <AdminListManager
        title="Colores"
        apiEndpoint={colors}
        fieldName="name"
      />
    </div>
  );
};

export default AdminColorsPage;
