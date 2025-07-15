const CategoryFormBlock = ({ newCategory, setNewCategory, handleCreate }) => (
  <div className="category-form">
    <input
      type="text"
      value={newCategory}
      onChange={(e) => setNewCategory(e.target.value)}
      placeholder="Nueva categoría"
    />
    <button onClick={handleCreate} className="btn-save">Crear</button>
  </div>
);

export default CategoryFormBlock;
