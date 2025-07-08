import { useState } from "react";

const ProductDetailBlock = ({ product, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);

  const handleAdd = () => {
    if (quantity > product.stock) {
      alert("No hay suficiente stock disponible.");
      return;
    }
    onAddToCart(product, quantity);
    alert("Producto agregado al carrito.");
  };

  return (
    <div className="product-detail">
      <img
        src={product.imageUrl}
        alt={product.name}
        className="detail-image"
      />
      <div className="detail-info">
        <h2>{product.name}</h2>
        <p>{product.description}</p>
        <p className="price">Precio: ${product.price}</p>
        <p className="stock">Stock disponible: {product.stock}</p>

        <div className="quantity-box">
          <label>Cantidad:</label>
          <input
            type="number"
            min="1"
            max={product.stock}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>

        <button className="btn-add" onClick={handleAdd}>
          Agregar al carrito
        </button>
      </div>
    </div>
  );
};

export default ProductDetailBlock;
