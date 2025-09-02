
   import { useEffect, useState, useContext  } from "react";
import { AuthContext } from "../contexts/AuthContext";
import api from "../../api/apiClient";
import { useToast } from "../../contexts/ToastContext";
import ProductListBlocks from "../../blocks/users/ProductListBlocks"; 

export default function FavoritesPage() {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!user || user.role !== "user") {
        setItems([]);
        if (!user) showToast("Inicia sesión para ver tus favoritos", "info");
        else showToast("Solo usuarios pueden ver favoritos", "warning");
        return;
      }
      try {
        const { data } = await api.get("favorites", { params: { populate: 1 }});
        if (!cancel) setItems(data?.products || []);
      } catch (e) {
        if (!cancel) showToast("No se pudieron cargar favoritos", "error");
      }
    })();
    return () => { cancel = true; };
  }, [user, showToast]);

  return (
    <section className="favorites-page">
      <h1>Mis Favoritos</h1>
      {products.length === 0 ? (
        <p>No tienes productos en favoritos.</p>
      ) : (
        <div className="product-grid">
          {products.map((p) => (
            <ProductListBlocks key={p._id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}