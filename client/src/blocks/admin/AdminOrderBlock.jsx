const AdminOrderRow = ({ order }) => {
  
  return (
    <tr>
      <td>{order.user?.name || "Usuario eliminado"}</td>
      <td>${order.total}</td>
      <td>{new Date(order.createdAt).toLocaleString()}</td>
      <td>
        <ul>
          {order.items.map((item) => (
            <li key={item._id}>{item.product?.name || "Producto eliminado"}</li>
          ))}
        </ul>
      </td>
      <td>
        <ul>
          {order.items.map((item) => (
            <li key={item._id}>{item.quantity}</li>
          ))}
        </ul>
      </td>
      <td>{order.status}</td>
    </tr>
  );
};

export default AdminOrderRow;
