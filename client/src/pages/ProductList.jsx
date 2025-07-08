import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const ProductList = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/products")
      .then((res) => setProducts(res.data))
      .catch((err) => console.error("Error al cargar productos", err));
  }, []);

  return (
    <div>
      <h2>Artesanías en Paja Toquilla</h2>
      {products.map((p) => (
        <div
          key={p._id}
          style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}
        >
          <h3>{p.name}</h3>
          <img src={p.imageUrl} alt={p.name} width="200" />
          <p>{p.description}</p>
          <p>
            <strong>${p.price}</strong> - Stock: {p.stock}
          </p>
          <h3>
            <Link to={`/product/${p._id}`}>{p.name}</Link>
          </h3>
        </div>
      ))}
    </div>
  );
};

export default ProductList;
