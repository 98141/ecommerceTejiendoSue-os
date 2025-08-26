import { useState, useContext, useEffect, useMemo, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";

import apiUrl from "../../api/apiClient";
import { getBaseUrl } from "../../api/apiClient";

import { AuthContext } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import ProductPriceBlock from "../ProductPrice";

/* =============== Helpers =============== */
const idVal = (x) =>
  typeof x === "object" && x?._id ? String(x._id) : String(x || "");

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

const Star = ({ filled = false, className = "" }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={`star ${className}`}>
    <path
      d="M12 17.3l-6.18 3.73L7 14.25 2 9.97l6.91-1.01L12 3l3.09 5.96L22 9.97l-5 4.28 1.18 6.78z"
      className={filled ? "filled" : ""}
    />
  </svg>
);

const StarRatingDisplay = ({ value = 0, size = "md" }) => {
  const n = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <div className={`rating rating--${size}`} title={`${n.toFixed(1)} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} filled={i <= Math.round(n)} />
      ))}
      <b>{n.toFixed(1)}</b>
    </div>
  );
};

const StarRatingInput = ({ value, onChange }) => (
  <div className="rating-input" role="radiogroup" aria-label="Calificación">
    {[5, 4, 3, 2, 1].map((v) => (
      <label
        key={v}
        className="rating-input__opt"
        aria-label={`${v} estrellas`}
      >
        <input
          type="radio"
          name="stars"
          value={v}
          checked={Number(value) === v}
          onChange={() => onChange(v)}
        />
        <div className="stars">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} filled={i <= v} />
          ))}
        </div>
      </label>
    ))}
  </div>
);

const MiniCard = ({ item }) => {
  const mainImage = item?.images?.[0] || "/placeholder.jpg";
  const effective =
    typeof item?.effectivePrice !== "undefined"
      ? item.effectivePrice
      : computeEffectiveFallback(item);

    const baseUrl = getBaseUrl();

  return (
    <Link to={`/product/${item?._id}`} className="mini">
      <img
        src={`${baseUrl}${mainImage}`}
        onError={(e) => (e.currentTarget.src = "/placeholder.jpg")}
        alt={item?.name}
        loading="lazy"
      />
      <div className="mini__body">
        <span className="mini__title">{item?.name}</span>
        <div className="mini__price">
          <ProductPriceBlock price={item?.price} effectivePrice={effective} />
        </div>
      </div>
    </Link>
  );
};

/* =============== Componente principal =============== */
const ProductDetailBlock = ({
  product,
  onAddToCart,
  featuredProducts = [],
}) => {
  const images = product?.images?.length
    ? product.images
    : ["/placeholder.jpg"];
  const [selectedImage, setSelectedImage] = useState(images[0]);

  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [availableStock, setAvailableStock] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const baseUrl = getBaseUrl();

  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  /* ----- Lightbox state ----- */
  const [lbOpen, setLbOpen] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);
  const touchStartX = useRef(null);

  const openLightbox = (idx) => {
    setLbIndex(idx);
    setLbOpen(true);
  };
  const closeLightbox = () => setLbOpen(false);
  const goPrev = () =>
    setLbIndex((i) => (i - 1 + images.length) % images.length);
  const goNext = () => setLbIndex((i) => (i + 1) % images.length);

  // teclado + bloquear scroll del body cuando está abierto
  useEffect(() => {
    if (!lbOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [lbOpen, images.length]);

  // pre-carga de siguiente y anterior
  useEffect(() => {
    if (!lbOpen) return;
    const preload = (src) => {
      const img = new Image();
      img.src = `${baseUrl}${src}`;
    };
    preload(images[(lbIndex + 1) % images.length]);
    preload(images[(lbIndex - 1 + images.length) % images.length]);
  }, [lbOpen, lbIndex, images]);

  // swipe táctil
  const onTouchStart = (e) => (touchStartX.current = e.touches[0].clientX);
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    const TH = 40; // umbral
    if (dx > TH) goPrev();
    else if (dx < -TH) goNext();
  };

  /* ----- Catálogos ----- */
  useEffect(() => {
    const fetchSizeAndColorNames = async () => {
      try {
        const [sizeRes, colorRes] = await Promise.all([
          apiUrl.get("sizes"),
          apiUrl.get("colors"),
        ]);
        setSizes(sizeRes.data);
        setColors(colorRes.data);
      } catch {
        showToast("Error al cargar tallas o colores", "error");
      }
    };
    fetchSizeAndColorNames();
  }, [showToast]);

  /* ----- Stock por variante ----- */
  useEffect(() => {
    if (selectedSize && selectedColor) {
      const variant = product.variants.find(
        (v) =>
          idVal(v.size) === selectedSize && idVal(v.color) === selectedColor
      );
      const stock = Number(variant?.stock || 0);
      setAvailableStock(stock);
      if (quantity > stock) setQuantity(1);
    } else {
      setAvailableStock(0);
      setQuantity(1);
    }
  }, [selectedSize, selectedColor, product.variants, quantity]);

  const availableSizes = useMemo(() => {
    const sizeIdsInProduct = new Set(
      product.variants.map((v) => idVal(v.size))
    );
    if (sizes?.length)
      return sizes.filter((s) => sizeIdsInProduct.has(String(s._id)));
    const map = new Map();
    product.variants.forEach((v) => {
      const s = v.size;
      if (s && typeof s === "object" && s._id && s.label)
        map.set(String(s._id), { _id: String(s._id), label: s.label });
      else {
        const id = idVal(s);
        map.set(id, { _id: id, label: id });
      }
    });
    return Array.from(map.values());
  }, [product.variants, sizes]);

  useEffect(() => {
    if (
      selectedSize &&
      !availableSizes.some((s) => String(s._id) === selectedSize)
    ) {
      setSelectedSize("");
      setSelectedColor("");
    }
  }, [availableSizes, selectedSize]);

  const getColorsForSelectedSize = () => {
    if (!selectedSize) return [];
    const variantsForSize = product.variants.filter(
      (v) => idVal(v.size) === selectedSize
    );
    const colorIds = new Set(variantsForSize.map((v) => idVal(v.color)));
    const fromCatalog = colors.filter((c) => colorIds.has(String(c._id)));
    if (fromCatalog.length) return fromCatalog;

    const map = new Map();
    variantsForSize.forEach((v) => {
      const c = v.color;
      if (c && typeof c === "object" && c._id && c.name)
        map.set(String(c._id), { _id: String(c._id), name: c.name });
      else {
        const id = idVal(c);
        map.set(id, { _id: id, name: id });
      }
    });
    return Array.from(map.values());
  };

  /* ----- Carrito ----- */
  const { showToast: toast } = useToast();
  const { user: currentUser } = useContext(AuthContext);
  const handleAdd = () => {
    if (!currentUser || currentUser.role === "admin") {
      toast("Debes iniciar sesión como usuario para comprar", "warning");
      return navigate("/login");
    }
    if (!selectedSize || !selectedColor) {
      toast("Debes seleccionar talla y color", "warning");
      return;
    }
    const variant = product.variants.find(
      (v) => idVal(v.size) === selectedSize && idVal(v.color) === selectedColor
    );
    if (!variant) return toast("Variante no disponible", "error");
    if (variant.stock < quantity) return toast("Stock insuficiente", "error");

    const sizeObj = sizes.find((s) => String(s._id) === selectedSize) || {
      _id: selectedSize,
    };
    const colorObj = colors.find((c) => String(c._id) === selectedColor) || {
      _id: selectedColor,
    };
    const cartItem = { ...product, size: sizeObj, color: colorObj };
    onAddToCart(cartItem, quantity);
    toast("Producto agregado al carrito", "success");
  };

  /* ----- Precio ----- */
  const effectivePrice =
    typeof product.effectivePrice !== "undefined"
      ? product.effectivePrice
      : computeEffectiveFallback(product);

  /* ----- Opiniones (solo frontend) ----- */
  const [reviews, setReviews] = useState(() => product.reviews || []);
  const avg = useMemo(() => {
    if (!reviews.length) return 0;
    return (
      reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length
    );
  }, [reviews]);
  const dist = useMemo(() => {
    const d = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => (d[r.rating] = (d[r.rating] || 0) + 1));
    return d;
  }, [reviews]);

  const [newRating, setNewRating] = useState(5);
  const [newText, setNewText] = useState("");
  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!newText.trim()) return showToast("Escribe tu opinión", "warning");
    const author = user?.name || "Invitado";
    const newReview = {
      id: `temp-${Date.now()}`,
      author,
      rating: newRating,
      text: newText.trim(),
      date: new Date().toISOString(),
    };
    setReviews((r) => [newReview, ...r]);
    setNewText("");
    setNewRating(5);
    showToast("Gracias por tu reseña (guardado local por ahora)", "success");
  };

  /* ----- UI ----- */
  return (
    <div className="pd">
      <div className="pd__top">
        {/* Galería */}
        <div className="pd__media">
          <div className="pd__thumbs">
            {images.map((img, idx) => (
              <button
                key={idx}
                className={`pd__thumb ${selectedImage === img ? "active" : ""}`}
                onClick={() => setSelectedImage(img)}
                aria-label={`Imagen ${idx + 1}`}
                type="button"
              >
                <img
                  src={`${baseUrl}${img}`}
                  onError={(e) => (e.currentTarget.src = "/placeholder.jpg")}
                  alt={`mini-${idx}`}
                  loading="lazy"
                />
              </button>
            ))}
          </div>

          <figure className="pd__figure">
            <button
              className="pd__zoomBtn"
              onClick={() =>
                openLightbox(Math.max(0, images.indexOf(selectedImage)))
              }
              aria-label="Ampliar imagen"
              type="button"
            >
              <img
                src={`${baseUrl}${selectedImage}`}
                alt={product.name}
                onError={(e) => (e.currentTarget.src = "/placeholder.jpg")}
                className="pd__mainimg"
              />
            </button>
          </figure>
        </div>

        {/* Panel derecho */}
        <aside className="pd__panel">
          <div className="pd__breadcrumbs">
            <Link to="/">Inicio</Link> <span>›</span>{" "}
            <Link to="/artesanias">Artesanías</Link>
          </div>

          <h1 className="pd__title">{product.name}</h1>

          <div className="pd__ratingRow">
            <StarRatingDisplay value={avg} />
            <span className="pd__votes">
              {reviews.length} {reviews.length === 1 ? "opinión" : "opiniones"}
            </span>
          </div>

          <div className="pd__price">
            <ProductPriceBlock
              price={product.price}
              effectivePrice={effectivePrice}
            />
          </div>

          <div className="pd__shipping">
            <span className="pd__free">Envío gratis</span> a todo el país
          </div>

          <div className="pd__selectors">
            <div className="pd__field">
              <label>Talla</label>
              <select
                value={selectedSize}
                onChange={(e) => {
                  setSelectedSize(e.target.value);
                  setSelectedColor("");
                }}
              >
                <option value="">Seleccionar talla</option>
                {availableSizes.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedSize && (
              <div className="pd__field">
                <label>Color</label>
                <select
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                >
                  <option value="">Seleccionar color</option>
                  {getColorsForSelectedSize().map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedSize && selectedColor && (
              <p className="pd__stock">
                Stock disponible: <b>{availableStock}</b>
              </p>
            )}

            <div className="pd__qty">
              <label htmlFor="qty">Cantidad</label>
              <input
                id="qty"
                type="number"
                min="1"
                max={availableStock || 1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>

            <div className="pd__ctaRow">
              <button
                className="btn btn--primary"
                onClick={handleAdd}
                type="button"
              >
                Agregar al carrito
              </button>
              <button
                className="btn btn--ghost"
                onClick={() => showToast("Compra directa próximamente", "info")}
                type="button"
              >
                Comprar ahora
              </button>
            </div>

            <Link to="/" className="pd__back">
              ← Regresar al comercio
            </Link>
          </div>
        </aside>
      </div>

      {/* Descripción */}
      <section className="pd__section">
        <h2>Descripción</h2>
        <div className="pd__desc">
          {product.description ? (
            <p>{product.description}</p>
          ) : (
            <p>
              Producto artesanal elaborado con técnicas tradicionales. Pronto
              agregaremos una descripción detallada.
            </p>
          )}
        </div>
      </section>

      {/* Opiniones */}
      <section className="pd__section">
        <div className="pd__reviews">
          <div className="pd__summary">
            <h3>Opiniones del producto</h3>
            <div className="pd__avg">
              <StarRatingDisplay value={avg} size="lg" />
              <div className="pd__avgnum">{avg.toFixed(1)}</div>
              <div className="pd__avglbl">{reviews.length} calificaciones</div>
            </div>

            <div className="pd__bars">
              {[5, 4, 3, 2, 1].map((s) => {
                const count = dist[s] || 0;
                const pct = reviews.length
                  ? Math.round((count / reviews.length) * 100)
                  : 0;
                return (
                  <div key={s} className="bar">
                    <span className="bar__label">{s}</span>
                    <div className="bar__track">
                      <div className="bar__fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="bar__count">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pd__opinions">
            <form className="pd__form" onSubmit={handleSubmitReview}>
              <h4>Escribe tu reseña</h4>
              <StarRatingInput value={newRating} onChange={setNewRating} />
              <textarea
                placeholder="Cuéntanos tu experiencia con el producto…"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                rows={4}
              />
              <div className="pd__formActions">
                <button type="submit" className="btn btn--primary">
                  Enviar reseña
                </button>
                <span className="pd__hint">
                  Se mostrará al instante (almacenamiento local por ahora).
                </span>
              </div>
            </form>

            <ul className="pd__list">
              {reviews.length === 0 && (
                <li className="pd__empty">
                  Aún no hay opiniones. ¡Sé el primero en opinar!
                </li>
              )}
              {reviews.map((r) => (
                <li key={r.id || r._id} className="op">
                  <div className="op__header">
                    <StarRatingDisplay value={r.rating} />
                    <span className="op__author">{r.author || "Usuario"}</span>
                    <span className="op__date">
                      {new Date(r.date || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="op__text">{r.text}</p>
                  <div className="op__actions">
                    <button
                      type="button"
                      className="linklike"
                      onClick={() =>
                        showToast("Gracias por tu voto 👍", "success")
                      }
                    >
                      ¿Te fue útil?
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Destacados */}
      {featuredProducts?.length > 0 && (
        <section className="pd__section">
          <h2>Productos destacados</h2>
          <div className="pd__featured">
            {featuredProducts.map((it) => (
              <MiniCard key={it._id} item={it} />
            ))}
          </div>
        </section>
      )}

      {/* ============== LIGHTBOX / POPUP ============== */}
      <div
        className={`lb ${lbOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Vista ampliada de imágenes"
        onClick={closeLightbox}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <button
          className="lb__close"
          aria-label="Cerrar"
          onClick={closeLightbox}
          type="button"
        >
          ✕
        </button>

        {/* Botones navegación */}
        {images.length > 1 && (
          <>
            <button
              className="lb__nav lb__nav--prev"
              aria-label="Anterior"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              type="button"
            >
              ‹
            </button>
            <button
              className="lb__nav lb__nav--next"
              aria-label="Siguiente"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              type="button"
            >
              ›
            </button>
          </>
        )}

        <figure className="lb__stage" onClick={(e) => e.stopPropagation()}>
          <img
            src={`${baseUrl}${images[lbIndex]}`}
            alt={`imagen ${lbIndex + 1}`}
            className="lb__img"
            loading="eager"
          />
          <figcaption className="lb__counter">
            {lbIndex + 1} / {images.length}
          </figcaption>
        </figure>

        {/* Tira de miniaturas */}
        {images.length > 1 && (
          <div className="lb__thumbs" onClick={(e) => e.stopPropagation()}>
            {images.map((img, i) => (
              <button
                key={img + i}
                className={`lb__thumb ${i === lbIndex ? "active" : ""}`}
                onClick={() => setLbIndex(i)}
                type="button"
              >
                <img
                  src={`${baseUrl}${img}`}
                  alt={`mini ${i + 1}`}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailBlock;
