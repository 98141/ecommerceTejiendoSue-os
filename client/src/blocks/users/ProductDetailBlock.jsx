import { useState, useContext, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import axios from "axios";
import ProductPriceBlock from "../ProductPrice";

// helper: acepta ID o objeto populado { _id, ... }
const idVal = (x) => (typeof x === "object" && x?._id ? String(x._id) : String(x || ""));

// Fallback si por alguna razón no llega effectivePrice desde backend
const computeEffectiveFallback = (product) => {
  const price = Number(product?.price || 0);
  const d = product?.discount;
  if (!d?.enabled || !price) return price;

  const now = new Date();
  const start = d.startAt ? new Date(d.startAt) : null;
  const end = d.endAt ? new Date(d.endAt) : null;
  if ((start && now < start) || (end && now > end)) return price;

  let eff = price;
  if (d.type === "PERCENT") eff = price - (price * Number(d.value || 0) / 100);
  else eff = price - Number(d.value || 0);
  return Math.max(0, Number(eff.toFixed(2)));
};

const ProductDetailBlock = ({ product, onAddToCart }) => {
  const [selectedImage, setSelectedImage] = useState(product.images?.[0]);
  const [sizes, setSizes] = useState([]);   // catálogo (para labels)
  const [colors, setColors] = useState([]); // catálogo (para names)
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [availableStock, setAvailableStock] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Cargar catálogos de tallas/colores (solo para labels -> filtramos local con variants)
  useEffect(() => {
    const fetchSizeAndColorNames = async () => {
      try {
        const [sizeRes, colorRes] = await Promise.all([
          axios.get("http://localhost:5000/api/sizes"),
          axios.get("http://localhost:5000/api/colors"),
        ]);
        setSizes(sizeRes.data);
        setColors(colorRes.data);
      } catch {
        showToast("Error al cargar tallas o colores", "error");
      }
    };
    fetchSizeAndColorNames();
  }, [showToast]);

  // Recalcular stock cuando cambia talla/color
  useEffect(() => {
    if (selectedSize && selectedColor) {
      const variant = product.variants.find(
        (v) => idVal(v.size) === selectedSize && idVal(v.color) === selectedColor
      );
      const stock = Number(variant?.stock || 0);
      setAvailableStock(stock);
      if (quantity > stock) setQuantity(1);
    } else {
      setAvailableStock(0);
      setQuantity(1);
    }
  }, [selectedSize, selectedColor, product.variants, quantity]);

  // Tallas disponibles SOLO según el producto (usando catálogo para labels)
  const availableSizes = useMemo(() => {
    const sizeIdsInProduct = new Set(product.variants.map((v) => idVal(v.size)));
    if (sizes?.length) {
      return sizes.filter((s) => sizeIdsInProduct.has(String(s._id)));
    }
    // Si no hay catálogo, intenta construir desde variants (populadas o IDs)
    const map = new Map();
    product.variants.forEach((v) => {
      const s = v.size;
      if (s && typeof s === "object" && s._id && s.label) {
        map.set(String(s._id), { _id: String(s._id), label: s.label });
      } else {
        const id = idVal(s);
        map.set(id, { _id: id, label: id });
      }
    });
    return Array.from(map.values());
  }, [product.variants, sizes]);

  // Si la talla seleccionada ya no está disponible (al cambiar producto/datos), reset
  useEffect(() => {
    if (selectedSize && !availableSizes.some((s) => String(s._id) === selectedSize)) {
      setSelectedSize("");
      setSelectedColor("");
    }
  }, [availableSizes, selectedSize]);

  // Colores disponibles para la talla seleccionada (filtra por variants del producto)
  const getColorsForSelectedSize = () => {
    if (!selectedSize) return [];
    const variantsForSize = product.variants.filter((v) => idVal(v.size) === selectedSize);
    const colorIds = new Set(variantsForSize.map((v) => idVal(v.color)));
    // usar catálogo para nombres bonitos
    const fromCatalog = colors.filter((c) => colorIds.has(String(c._id)));
    if (fromCatalog.length) return fromCatalog;

    // fallback si no hay catálogo
    const map = new Map();
    variantsForSize.forEach((v) => {
      const c = v.color;
      if (c && typeof c === "object" && c._id && c.name) {
        map.set(String(c._id), { _id: String(c._id), name: c.name });
      } else {
        const id = idVal(c);
        map.set(id, { _id: id, name: id });
      }
    });
    return Array.from(map.values());
  };

  const handleAdd = () => {
    if (!user || user.role === "admin") {
      showToast("Debes iniciar sesión como usuario para comprar", "warning");
      return navigate("/login");
    }

    if (!selectedSize || !selectedColor) {
      showToast("Debes seleccionar talla y color", "warning");
      return;
    }

    const variant = product.variants.find(
      (v) => idVal(v.size) === selectedSize && idVal(v.color) === selectedColor
    );

    if (!variant) {
      showToast("La combinación seleccionada no está disponible", "error");
      return;
    }

    if (variant.stock < quantity) {
      showToast("Stock insuficiente para la variante seleccionada", "error");
      return;
    }

    const sizeObj = sizes.find((s) => String(s._id) === selectedSize) || { _id: selectedSize };
    const colorObj = colors.find((c) => String(c._id) === selectedColor) || { _id: selectedColor };

    const cartItem = {
      ...product,
      size: sizeObj,   // { _id, label? }
      color: colorObj, // { _id, name? }
    };

    onAddToCart(cartItem, quantity);
    showToast("Producto agregado al carrito", "success");
  };

  // precio efectivo (server → product.effectivePrice; fallback calculado si faltara)
  const effectivePrice =
    typeof product.effectivePrice !== "undefined"
      ? product.effectivePrice
      : computeEffectiveFallback(product);

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
            loading="lazy"
          />
        ))}
      </div>

      <div className="main-section">
        <img
          src={`http://localhost:5000${selectedImage}`}
          alt="ampliada"
          className="main-image"
          onError={(e) => { e.currentTarget.src = "/placeholder.jpg"; }}
        />

        <div className="detail-info">
          <h2>{product.name}</h2>
          <p>{product.description}</p>

          {/* Precio con badge “En oferta” arriba */}
          <ProductPriceBlock price={product.price} effectivePrice={effectivePrice} />

          <div className="selectors">
            <label>Talla:</label>
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

            {selectedSize && (
              <>
                <label>Color:</label>
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
              </>
            )}
          </div>

          {selectedSize && selectedColor && (
            <p className="stock">
              Stock disponible para esta combinación:{" "}
              <strong>{availableStock}</strong>
            </p>
          )}

          <div className="quantity-box">
            <label>Cantidad:</label>
            <input
              type="number"
              min="1"
              max={availableStock || 1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>

          <button className="btn-add" onClick={handleAdd}>
            Agregar al carrito
          </button>

          <Link to="/" className="btn-return">
            Regresar al comercio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailBlock;


