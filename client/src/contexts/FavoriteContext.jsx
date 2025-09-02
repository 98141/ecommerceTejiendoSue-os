// src/contexts/FavoriteContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/apiClient";
import { AuthContext } from "./AuthContext";
import { useToast } from "./ToastContext";

// eslint-disable-next-line react-refresh/only-export-components
export const FavoriteContext = createContext();

const GUEST_KEY = "guest:favorites";

/* Helpers para invitado (localStorage) */
function readGuest() {
  try { return JSON.parse(localStorage.getItem(GUEST_KEY) || "[]"); }
  catch { return []; }
}
function writeGuest(ids) {
  localStorage.setItem(GUEST_KEY, JSON.stringify(ids || []));
}

/* API helpers (usuario logueado) */
const getFavorites = (populate = false) =>
  api.get("/favorites", { params: { populate: populate ? 1 : 0 } });
const addFavoriteApi = (productId) => api.post(`/favorites/${productId}`);
const removeFavoriteApi = (productId) => api.delete(`/favorites/${productId}`);

export function FavoriteProvider({ children }) {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();

  const [ids, setIds] = useState([]);

  // Carga inicial
  useEffect(() => {
    let cancel = false;
    (async () => {
      // Invitado o admin -> usar local (admin no debería, pero por si acaso)
      if (!user || user.role !== "user") {
        const guest = readGuest();
        if (!cancel) setIds(guest);
        return;
      }
      try {
        const { data } = await getFavorites(false); // solo IDs
        if (!cancel) setIds(data?.productIds || []);
      } catch {
        if (!cancel) showToast("No se pudieron cargar tus favoritos", "error");
      }
    })();
    return () => { cancel = true; };
  }, [user, showToast]);

  const isFavorite = (productId) =>
    ids.some((x) => String(x) === String(productId));

  const addFavorite = async (productId) => {
    const prev = ids;
    const next = isFavorite(productId) ? prev : [...prev, productId];
    setIds(next);

    // Invitado o no-user -> local
    if (!user || user.role !== "user") {
      writeGuest(next);
      showToast("Guardado en tu lista (modo invitado)", "success");
      return;
    }

    try {
      await addFavoriteApi(productId);
    } catch {
      setIds(prev); // rollback
      showToast("No se pudo agregar a favoritos", "error");
    }
  };

  const removeFavorite = async (productId) => {
    const prev = ids;
    const next = prev.filter((x) => String(x) !== String(productId));
    setIds(next);

    if (!user || user.role !== "user") {
      writeGuest(next);
      showToast("Quitado de tu lista (modo invitado)", "success");
      return;
    }

    try {
      await removeFavoriteApi(productId);
    } catch {
      setIds(prev); // rollback
      showToast("No se pudo quitar de favoritos", "error");
    }
  };

  const toggleFavorite = async (productId) =>
    isFavorite(productId) ? removeFavorite(productId) : addFavorite(productId);

  // (Opcional) util para importación desde FavoritesPage
  const importGuestToAccount = async () => {
    if (!user || user.role !== "user") return { imported: 0 };
    const guest = readGuest();
    if (!guest.length) return { imported: 0 };

    let ok = 0;
    for (const pid of guest) {
      try { await addFavoriteApi(pid); ok++; } catch { /* no-op */ }
    }
    // tras importar, limpia los locales y recarga server IDs
    writeGuest([]);
    try {
      const { data } = await getFavorites(false);
      setIds(data?.productIds || []);
    } catch {/* no-op */}

    return { imported: ok };
  };

  const value = useMemo(() => ({
    favorites: ids,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    importGuestToAccount, // opcional
  }), [ids, user]);

  return (
    <FavoriteContext.Provider value={value}>
      {children}
    </FavoriteContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useFavorites = () => useContext(FavoriteContext);
