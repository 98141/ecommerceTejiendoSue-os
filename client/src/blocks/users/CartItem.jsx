const CartItem = ({ item, removeFromCart }) => {
  const total = item.price * item.quantity;

  return (
    <div className="cart-item">
      <img src={item.imageUrl} alt={item.name} className="cart-image" />
      <div className="cart-info">
        <h4>{item.name}</h4>
        <p>Precio: ${item.price}</p>
        <p>Cantidad: {item.quantity}</p>
        <p><strong>Total: ${total}</strong></p>
      </div>
      <button
        className="cart-remove"
        onClick={() => removeFromCart(item._id)}
      >
        Quitar
      </button>
    </div>
  );
};

export default CartItem;
