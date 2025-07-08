import { Link } from "react-router-dom";

const ProductCard = ({ product }) => {
  return (
    <div className="product-card">
      <img
        src={product.imageUrl}
        alt={product.name}
        className="product-image"
      />
      <h3>{product.name}</h3>
      <p className="price">${product.price}</p>
      <Link to={`/product/${product._id}`} className="btn-details">
        Ver detalles
      </Link>
    </div>
  );
};

export default ProductCard;
