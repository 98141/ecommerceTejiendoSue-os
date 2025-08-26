import { getBaseUrl } from "../../api/apiClient";

const CartItem = ({ item, removeFromCart, updateItem }) => {
  const { product, quantity, size, color } = item;
  const baseUrl = getBaseUrl();

  const handleChange = (e) => {
    const newQty = Number(e.target.value);
    if (newQty >= 1) {
      updateItem(product._id, size._id, color._id, newQty);
    }
  };

  return (
    <div className="cart-item">
      <img
        src={`${baseUrl}${product.images?.[0]}`}
        alt={product.name}
        className="cart-image"
      />
      <div className="cart-info">
        <h4>{product.name}</h4>
        <p>Precio unitario: ${product.price}</p>
        <p>Talla: {size.label}</p>
        <p>Color: {color.name}</p>
        <label>Cantidad:</label>
        <input
          type="number"
          value={quantity}
          min={1}
          onChange={handleChange}
        />
        <p>
          <strong>Total: ${product.price * quantity}</strong>
        </p>
      </div>
      <button
        className="cart-remove"
        onClick={() => removeFromCart(product._id, size._id, color._id)}
      >
        Quitar
      </button>
    </div>
  );
};

export default CartItem;
