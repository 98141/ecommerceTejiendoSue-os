import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

import apiUrl from "../api/apiClient";

import ProductListBlocks from "../blocks/users/ProductListBlocks";
import HeroBlock from "../blocks/users/HeroBlock";
import { AuthContext } from "../contexts/AuthContext";


const ProductList = () => {
  const [products, setProducts] = useState([]);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== "admin") {
      apiUrl
        .get(`products`)
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
