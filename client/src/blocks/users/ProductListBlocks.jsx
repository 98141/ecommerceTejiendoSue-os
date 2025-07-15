import { Link } from "react-router-dom";

const ProductListBlocks = ({ product }) => {
  const mainImage = product.images?.[0] || "/placeholder.jpg";

  return (
    <div className="product-card">
      <div className="product-gallery">
        <img
          src={`http://localhost:5000${mainImage}`}
          alt={product.name}
          className="product-image"
        />
      </div>

      <h3>{product.name}</h3>
      <p className="price">${product.price.toFixed(2)}</p>

      <Link to={`/product/${product._id}`} className="btn-details">
        Ver detalles
      </Link>
    </div>
  );
};

export default ProductListBlocks;
