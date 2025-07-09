import { useEffect, useState, useContext } from "react";
import axios from "axios";
import ProductCard from "../blocks/ProductCard";
import { AuthContext } from "../contexts/AuthContext";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user?.role !== "admin") {
      axios.get("http://localhost:5000/api/products")
        .then(res => setProducts(res.data))
        .catch(() => alert("Error al cargar productos"));
    }
  }, [user]);

  if (user?.role === "admin") {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Acceso restringido</h2>
        <p>Los administradores no pueden visualizar el catálogo de productos.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Catálogo de Artesanías</h2>
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center"
      }}>
        {products.map(p => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </div>
  );
};

export default ProductList;
