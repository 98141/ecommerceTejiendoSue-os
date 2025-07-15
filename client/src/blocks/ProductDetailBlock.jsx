import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { Link } from "react-router-dom";

const ProductDetailBlock = ({ product, onAddToCart }) => {
  const [selectedImage, setSelectedImage] = useState(product.images?.[0]);
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

  const [quantity, setQuantity] = useState(1);

  return (
    <div className="product-detail">
      <div className="side-images">
        {product.images?.map((img, idx) => (
          <img
            key={idx}
            src={`http://localhost:5000${img}`}
            alt={`img-${idx}`}
            className={`thumb-image ${selectedImage === img ? "active" : ""}`}
            onClick={() => setSelectedImage(img)}
          />
        ))}
      </div>

      <div className="main-section">
        <img
          src={`http://localhost:5000${selectedImage}`}
          alt="ampliada"
          className="main-image"
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
          <button className="btn-add">
            <Link to={`/`} className="btn-view">
              {" "}
              Regresar al comercio
            </Link>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailBlock;
