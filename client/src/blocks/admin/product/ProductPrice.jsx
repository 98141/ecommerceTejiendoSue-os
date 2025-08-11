const ProductPrice = ({ price, effectivePrice, className = "" }) => {
  const p = Number(price || 0);
  const e = Number(effectivePrice || 0);
  const hasDiscount = e > 0 && e < p;

  if (!p) return null;

  return (
    <div className={`product-price ${className}`}>
      {hasDiscount ? (
        <>
          <span className="price-original strike">${p.toFixed(2)}</span>
          <span className="price-effective">${e.toFixed(2)}</span>
          <span className="badge-offer">En oferta</span>
        </>
      ) : (
        <span className="price-regular">${p.toFixed(2)}</span>
      )}
    </div>
  );
};

export default ProductPrice;
