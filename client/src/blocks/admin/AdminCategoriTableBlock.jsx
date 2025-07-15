const CategoryTableBlock = ({
  categories,
  editingCategory,
  setEditingCategory,
  setShowConfirm,
  handleEdit,
}) => (
  <table className="admin-table">
    <thead>
      <tr>
        <th>Nombre</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody>
      {categories.map((cat) => (
        <tr key={cat._id}>
          <td>
            {editingCategory?._id === cat._id ? (
              <input
                value={editingCategory.name}
                onChange={(e) =>
                  setEditingCategory({ ...editingCategory, name: e.target.value })
                }
              />
            ) : (
              cat.name
            )}
          </td>
          <td>
            {editingCategory?._id === cat._id ? (
              <>
                <button onClick={handleEdit}>Guardar</button>
                <button onClick={() => setEditingCategory(null)}>Cancelar</button>
              </>
            ) : (
              <>
                <button onClick={() => setEditingCategory(cat)}>Editar</button>
                <button onClick={() => {
                  setEditingCategory(cat);
                  setShowConfirm(true);
                }}>
                  Eliminar
                </button>
              </>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default CategoryTableBlock;
