import { useParams } from "react-router-dom";
import { useEffect, useState, useContext } from "react";

import apiUrl from "../api/apiClient";

import ProductDetailBlock from "../blocks/users/ProductDetailBlock";
import { CartContext } from "../contexts/CartContext";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    apiUrl
      .get(`products/${id}`)
      .then((res) => setProduct(res.data))
      .catch(() => alert("No se pudo cargar el producto."));
  }, [id]);

  if (!product) return <p>Cargando producto...</p>;

  return (
    <ProductDetailBlock
      product={product}
      onAddToCart={(item, qty) => addToCart(item, qty)}
      //featuredProducts={Productos destacados meter codigo}  
    />
  );
};

export default ProductDetail;
