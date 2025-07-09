import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

const ProductDetailBlock = ({ product, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleAdd = () => {
    if (!user || user.role === "admin") {
      showToast("Debes iniciar sesión como usuario para comprar", "warning");
      navigate("/login");
      return;
    }

    if (quantity > product.stock) {
      showToast("No hay suficiente stock disponible", "error");
      return;
    }

    onAddToCart(product, quantity);
    showToast("Producto agregado al carrito", "success");
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

