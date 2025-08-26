import { useEffect, useState } from "react";
import axios from "axios";

import apiUrl from "../../api/apiClient";

const OrderItemEditor = ({ item, onChange, index }) => {
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [productVariants, setProductVariants] = useState([]);
  const [variantError, setVariantError] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/sizes")
      .then((res) => setSizes(res.data));
    axios
      .get("http://localhost:5000/api/colors")
      .then((res) => setColors(res.data));

    // Obtener variantes del producto actual (por ID)
    if (item.product?._id) {
      axios
        .get(`http://localhost:5000/api/products/${item.product._id}`)
        .then((res) => {
          setProductVariants(res.data.variants || []);
        })
        .catch(() => {
          setProductVariants([]);
        });
    }
  }, [item.product?._id]);

  // Validar si talla + color existen como variante
  useEffect(() => {
    if (item.size && item.color && productVariants.length > 0) {
      const exists = productVariants.some(
        (v) => v.size === item.size && v.color === item.color
      );
      if (!exists) {
        const tallaLabel =
          sizes.find((s) => s._id === item.size)?.label || "Talla";
        const colorLabel =
          colors.find((c) => c._id === item.color)?.name || "Color";
        setVariantError(
          `❌ La combinación ${tallaLabel} / ${colorLabel} no está disponible.`
        );
      } else {
        setVariantError("");
      }
    } else {
      setVariantError("");
    }
  }, [item.size, item.color, productVariants, sizes, colors]);

  const handleChange = (field, value) => {
    onChange(index, { ...item, [field]: value });
  };

  return (
    <div className="order-item-editor">
      <p>
        <strong>Producto:</strong> {item.product?.name || "Eliminado"}
      </p>

      <label title="Cantidad deseada del producto">
        Cantidad:
        <input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) => handleChange("quantity", Number(e.target.value))}
        />
      </label>

      <label title="Talla seleccionada para este producto">
        Talla:
        <select
          value={item.size || ""}
          onChange={(e) => handleChange("size", e.target.value)}
        >
          <option value="">Selecciona talla</option>
          {sizes.map((size) => (
            <option key={size._id} value={size._id}>
              {size.label}
            </option>
          ))}
        </select>
      </label>

      <label title="Color seleccionado para este producto">
        Color:
        <select
          value={item.color || ""}
          onChange={(e) => handleChange("color", e.target.value)}
        >
          <option value="">Selecciona color</option>
          {colors.map((color) => (
            <option key={color._id} value={color._id}>
              {color.name}
            </option>
          ))}
        </select>
      </label>

      {variantError && (
        <p style={{ color: "red", marginTop: "4px" }}>{variantError}</p>
      )}
    </div>
  );
};

export default OrderItemEditor;
