import { formatCOP } from "../utils/currency";

const ProductPriceBlock = ({ price, effectivePrice, className = "" }) => {
  
  const p = Number(price || 0);
  const e = Number(effectivePrice || 0);
  const hasDiscount = e > 0 && e < p;

  if (!p) return null;

  return (
    <div className={`product-price ${className}`}>
      {hasDiscount ? (
        <>
          <span className="badge-offer">En oferta</span>
          <span className="price-original strike">{formatCOP(p)}</span>
          <span className="price-effective">{formatCOP(p)}</span>
        </>
      ) : (
        <span className="price-regular">{formatCOP(p)}</span>
      )}
    </div>
  );
};

export default ProductPriceBlock;
