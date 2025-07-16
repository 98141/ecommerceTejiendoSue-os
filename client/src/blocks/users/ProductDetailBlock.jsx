import { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import axios from "axios";

const ProductDetailBlock = ({ product, onAddToCart }) => {
  const [selectedImage, setSelectedImage] = useState(product.images?.[0]);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [availableStock, setAvailableStock] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSizeAndColorNames();
  }, []);

  useEffect(() => {
    if (selectedSize && selectedColor) {
      const variant = product.variants.find(
        (v) => v.size === selectedSize && v.color === selectedColor
      );
      setAvailableStock(variant?.stock || 0);
      if (quantity > variant?.stock) setQuantity(1);
    }
  }, [selectedSize, selectedColor]);

  const fetchSizeAndColorNames = async () => {
    try {
      const [sizeRes, colorRes] = await Promise.all([
        axios.get("http://localhost:5000/api/sizes"),
        axios.get("http://localhost:5000/api/colors")
      ]);
      setSizes(sizeRes.data);
      setColors(colorRes.data);
    } catch {
      showToast("Error al cargar tallas o colores", "error");
    }
  };

  const getColorsForSelectedSize = () => {
    const variantsForSize = product.variants.filter(v => v.size === selectedSize);
    const colorIds = [...new Set(variantsForSize.map(v => v.color))];
    return colors.filter(c => colorIds.includes(c._id));
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
      (v) => v.size === selectedSize && v.color === selectedColor
    );

    if (!variant) {
      showToast("La combinación seleccionada no está disponible", "error");
      return;
    }

    if (variant.stock < quantity) {
      showToast("Stock insuficiente para la variante seleccionada", "error");
      return;
    }

    const sizeLabel = sizes.find(s => s._id === selectedSize)?.label || "Talla";
    const colorName = colors.find(c => c._id === selectedColor)?.name || "Color";

    // Crear una clave única para el carrito
    const cartItem = {
      product: {
        ...product,
        variantId: variant._id,
        size: sizeLabel,
        color: colorName,
        variantStock: variant.stock
      },
      quantity
    };

    onAddToCart(cartItem.product, cartItem.quantity);

    showToast("Producto agregado al carrito", "success");
  };

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

          <div className="selectors">
            <label>Talla:</label>
            <select value={selectedSize} onChange={(e) => {
              setSelectedSize(e.target.value);
              setSelectedColor("");
            }}>
              <option value="">Seleccionar talla</option>
              {sizes.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.label}
                </option>
              ))}
            </select>

            {selectedSize && (
              <>
                <label>Color:</label>
                <select value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)}>
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
              Stock disponible para esta combinación: <strong>{availableStock}</strong>
            </p>
          )}

          <div className="quantity-box">
            <label>Cantidad:</label>
            <input
              type="number"
              min="1"
              max={availableStock}
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
