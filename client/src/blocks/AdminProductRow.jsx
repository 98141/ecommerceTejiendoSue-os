const AdminProductRow = ({ product, onEdit, onDelete }) => {
  return (
    <tr>
      <td>{product.name}</td>
      <td>${product.price}</td>
      <td>{product.stock}</td>
      <td>
        <button className="btn-edit" onClick={() => onEdit(product)}>Editar</button>
        <button className="btn-delete" onClick={() => onDelete(product._id)}>Eliminar</button>
      </td>
    </tr>
  );
};

export default AdminProductRow;
