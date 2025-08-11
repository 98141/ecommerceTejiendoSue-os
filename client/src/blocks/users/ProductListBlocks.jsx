import { Link } from "react-router-dom";
import ProductPrice from "../ProductPrice";

// Fallback defensivo por si algún producto no trae effectivePrice (no debería pasar si tu backend está actualizado)
const computeEffectiveFallback = (product) => {
  const price = Number(product?.price || 0);
  const d = product?.discount;
  if (!d?.enabled || !price) return price;

  const now = new Date();
  const start = d.startAt ? new Date(d.startAt) : null;
  const end = d.endAt ? new Date(d.endAt) : null;
  if ((start && now < start) || (end && now > end)) return price;

  let eff = price;
  if (d.type === "PERCENT") eff = price - (price * Number(d.value || 0)) / 100;
  else eff = price - Number(d.value || 0);
  return Math.max(0, Number(eff.toFixed(2)));
};

const ProductListBlocks = ({ product }) => {
  const mainImage = product.images?.[0] || "/placeholder.jpg";
  const effectivePrice =
    typeof product.effectivePrice !== "undefined"
      ? product.effectivePrice
      : computeEffectiveFallback(product);

  return (
    <div className="product-card">
      <h3 className="product-title">{product.name}</h3>
      <div className="product-gallery">
        <img
          src={`http://localhost:5000${mainImage}`}
          alt={product.name}
          className="product-image"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = "/placeholder.jpg";
          }}
        />
      </div>

      {/* 👇 Aquí sustituimos el <p className="price"> por el bloque reutilizable */}
      <ProductPrice
        price={product.price}
        effectivePrice={effectivePrice}
        className="card-price"
      />

      <Link to={`/product/${product._id}`} className="btn-details">
        Ver detalles
      </Link>
    </div>
  );
};

export default ProductListBlocks;
