import { useFavorites } from "../../contexts/FavoriteContext";
import { useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";

export default function FavoriteButton({ productId, className = "" }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();

  const active = isFavorite(productId);
  // Invitado permitido (local). Solo bloquea si hay user y NO es 'user' (ej: admin)
  const blocked = !!user && user.role !== "user";

  const onClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (blocked) {
      showToast("Solo usuarios pueden usar favoritos", "warning");
      return;
    }
    await toggleFavorite(productId); // invitado -> localStorage, user -> backend
  };

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? "Quitar de favoritos" : "Agregar a favoritos"}
      onClick={onClick}
      className={`fav-btn ${active ? "is-active" : ""} ${blocked ? "is-disabled" : ""} ${className}`}
      title={active ? "Quitar de favoritos" : "Agregar a favoritos"}
      disabled={blocked}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21s-6.716-4.35-9.33-7.12C.5 11.6 1.09 8.16 3.64 6.84A4.86 4.86 0 0 1 12 8.17a4.86 4.86 0 0 1 8.36-1.33c2.55 1.32 3.14 4.76.97 7.04C18.716 16.65 12 21 12 21z" />
      </svg>
      <span className="sr-only">
        {active ? "Quitar de favoritos" : "Agregar a favoritos"}
      </span>
    </button>
  );
}
