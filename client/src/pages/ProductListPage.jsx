import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import ProductListBlocks from "../blocks/users/ProductListBlocks";
import HeroBlock from "../blocks/users/HeroBlock";
import { AuthContext } from "../contexts/AuthContext";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const { user } = useContext(AuthContext);
    const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== "admin") {
      axios
        .get("http://localhost:5000/api/products")
        .then((res) => setProducts(res.data))
        .catch(() => alert("Error al cargar productos"));
    }
  }, [user]);

  if (user?.role === "admin") {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Acceso restringido</h2>
        <p>
          Los administradores no pueden visualizar el catálogo de productos.
        </p>
      </div>
    );
  }
  

  return (
    <div style={{ padding: "20px" }}>
      <HeroBlock
        onPrimaryClick={() => navigate("/products")}
        onSecondaryClick={() => navigate("/nosotros")}
        // Si aún no tienes la imagen local, puedes usar temporalmente un enlace directo:
        // imageSrc="https://images.unsplash.com/photo-1589364515321-049889246b8b?q=80&w=1600&auto=format&fit=crop"
      />
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
        Catálogo de Artesanías
      </h2>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "16px",
        }}
      >
        {products.map((p) => (
          <ProductListBlocks key={p._id} product={p} />
        ))}
      </div>
    </div>
  );
};

export default ProductList;
