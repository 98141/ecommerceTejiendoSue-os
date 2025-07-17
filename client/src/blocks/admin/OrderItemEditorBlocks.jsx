import { useEffect, useState } from "react";
import axios from "axios";

const OrderItemEditor = ({ item, onChange, index }) => {
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/sizes").then((res) => setSizes(res.data));
    axios.get("http://localhost:5000/api/colors").then((res) => setColors(res.data));
  }, []);

  const handleChange = (field, value) => {
    onChange(index, { ...item, [field]: value });
  };

  return (
    <div className="order-item-editor">
      <p><strong>Producto:</strong> {item.product?.name || "Eliminado"}</p>

      <label>
        Cantidad:
        <input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) => handleChange("quantity", Number(e.target.value))}
        />
      </label>

      <label>
        Talla:
        <select
          value={item.size || ""}
          onChange={(e) => handleChange("size", e.target.value)}
        >
          <option value="">Selecciona talla</option>
          {sizes.map((size) => (
            <option key={size._id} value={size._id}>{size.label}</option>
          ))}
        </select>
      </label>

      <label>
        Color:
        <select
          value={item.color || ""}
          onChange={(e) => handleChange("color", e.target.value)}
        >
          <option value="">Selecciona color</option>
          {colors.map((color) => (
            <option key={color._id} value={color._id}>{color.name}</option>
          ))}
        </select>
      </label>
    </div>
  );
};

export default OrderItemEditor;
