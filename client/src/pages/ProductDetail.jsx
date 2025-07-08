import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { CartContext } from "../contexts/CartContext";

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useContext(CartContext);
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/products/${id}`)
      .then(res => setProduct(res.data))
      .catch(err => {
        alert("Producto no encontrado");
        navigate("/");
      });
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;

    if (quantity < 1 || quantity > product.stock) {
      alert("Cantidad no válida");
      return;
    }

    addToCart(product, quantity);
    alert("Producto agregado al carrito");
  };

  if (!product) return <p>Cargando producto...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>{product.name}</h2>
      <img src={product.imageUrl} alt={product.name} width="250" />
      <p>{product.description}</p>
      <p>Precio: ${product.price} | Stock: {product.stock}</p>
      <div>
        <input
          type="number"
          value={quantity}
          min="1"
          max={product.stock}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />
        <button onClick={handleAddToCart}>Agregar al carrito</button>
      </div>
    </div>
  );
};

export default ProductDetail;
