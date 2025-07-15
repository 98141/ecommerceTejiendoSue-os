import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import ConfirmModal from "../../../blocks/ConfirmModalBlock";
import CategoryFormBlock from "../../../blocks/admin/AdminCategoriFormBlock";
import CategoryTableBlock from "../../../blocks/admin/AdminCategoriTableBlock";

const AdminCategoryPage = () => {
  const { token } = useContext(AuthContext);
  const { showToast } = useToast();

  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/categories");
      setCategories(res.data);
    } catch {
      showToast("Error al cargar categorías", "error");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async () => {
    if (!newCategory.trim()) return;

    try {
      await axios.post(
        "http://localhost:5000/api/categories",
        { name: newCategory },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("Categoría creada", "success");
      setNewCategory("");
      fetchCategories();
    } catch {
      showToast("Error al crear categoría", "error");
    }
  };

  const handleEdit = async () => {
    if (!editingCategory.name.trim()) return;

    try {
      await axios.put(
        `http://localhost:5000/api/categories/${editingCategory._id}`,
        { name: editingCategory.name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("Categoría actualizada", "success");
      setEditingCategory(null);
      fetchCategories();
    } catch {
      showToast("Error al actualizar categoría", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(
        `http://localhost:5000/api/categories/${editingCategory._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("Categoría eliminada", "success");
      setEditingCategory(null);
      setShowConfirm(false);
      fetchCategories();
    } catch {
      showToast("Error al eliminar categoría", "error");
    }
  };

  return (
    <div className="admin-category-page">
      <h2 className="category-title">📂 Gestión de Categorías</h2>

      <CategoryFormBlock
        newCategory={newCategory}
        setNewCategory={setNewCategory}
        handleCreate={handleCreate}
      />

      <CategoryTableBlock
        categories={categories}
        editingCategory={editingCategory}
        setEditingCategory={setEditingCategory}
        setShowConfirm={setShowConfirm}
        handleEdit={handleEdit}
      />

      {showConfirm && (
        <ConfirmModal
          title="Eliminar categoría"
          message={`¿Estás seguro de eliminar la categoría "${editingCategory?.name}"?`}
          onConfirm={handleDelete}
          onCancel={() => {
            setEditingCategory(null);
            setShowConfirm(false);
          }}
        />
      )}
    </div>
  );
};

export default AdminCategoryPage;
