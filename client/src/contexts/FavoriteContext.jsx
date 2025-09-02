import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/apiClient";
import { AuthContext } from "./AuthContext";
import { useToast } from "./ToastContext";

// eslint-disable-next-line react-refresh/only-export-components
export const FavoriteContext = createContext();

const getFavorites = (populate = true) =>
  api.get("favorites", { params: { populate: populate ? 1 : 0 } });

const addFavoriteApi = (productId) => api.post(`favorites/${productId}`);
const removeFavoriteApi = (productId) => api.delete(`favorites/${productId}`);

export function FavoriteProvider({ children }) {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();

  const [ids, setIds] = useState([]);

  // Carga inicial: solo si hay user y es rol "user"
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!user || user.role !== "user") {
        if (!cancel) setIds([]);
        return;
      }
      try {
        const { data } = await getFavorites(false);
        if (!cancel) setIds(data?.productIds || []);
      } catch {
        if (!cancel) showToast("No se pudieron cargar tus favoritos", "error");
      }
    })();
    return () => { cancel = true; };
  }, [user, showToast]);

  const isFavorite = (productId) =>
    ids.some((x) => String(x) === String(productId));

  const mustBeUser = () => {
    if (!user) {
      showToast("Inicia sesión para usar favoritos", "info");
      return false;
    }
    if (user.role !== "user") {
      showToast("Solo usuarios pueden usar favoritos", "warning");
      return false;
    }
    return true;
  };

  const addFavorite = async (productId) => {
    if (!mustBeUser()) return;
    const prev = ids;
    const next = isFavorite(productId) ? prev : [...prev, productId];
    setIds(next);
    try {
      await addFavoriteApi(productId);
    } catch {
      setIds(prev); // rollback
      showToast("No se pudo agregar a favoritos", "error");
    }
  };

  const removeFavorite = async (productId) => {
    if (!mustBeUser()) return;
    const prev = ids;
    const next = prev.filter((x) => String(x) !== String(productId));
    setIds(next);
    try {
      await removeFavoriteApi(productId);
    } catch {
      setIds(prev); // rollback
      showToast("No se pudo quitar de favoritos", "error");
    }
  };

  const toggleFavorite = async (productId) =>
    isFavorite(productId) ? removeFavorite(productId) : addFavorite(productId);

  const value = useMemo(() => ({
    favorites: ids,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
  }), [ids]);

  return (
    <FavoriteContext.Provider value={value}>
      {children}
    </FavoriteContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useFavorites = () => useContext(FavoriteContext);
