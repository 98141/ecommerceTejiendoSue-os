import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AuthContext } from "../contexts/AuthContext";

export const CartContext = createContext();

// Límite razonable por ítem (ajústalo a tu negocio)
const MAX_QTY_PER_ITEM = 20;

function clampQty(q) {
  const n = Number(q) || 0;
  return Math.max(1, Math.min(MAX_QTY_PER_ITEM, n));
}

// Clave única por variante
function variantKey(productId, sizeId, colorId) {
  return `${String(productId)}::${String(sizeId || "")}::${String(
    colorId || ""
  )}`;
}

// Extrae ids de forma segura (tolera que size/color sean objeto o id, o no existan)
function getIdsFromItem(item) {
  const sizeVal = item?.size;
  const colorVal = item?.color;
  return {
    productId: item?.product?._id,
    sizeId: typeof sizeVal === "object" ? sizeVal?._id : sizeVal ?? null,
    colorId: typeof colorVal === "object" ? colorVal?._id : colorVal ?? null,
  };
}

// Serializa solo lo esencial para storage
function toStorableCart(cart) {
  return cart.map((i) => ({
    product: {
      _id: i.product?._id,
      name: i.product?.name,
      price: i.product?.price,
      images: Array.isArray(i.product?.images) ? i.product.images : [],
    },
    size: i.size
      ? typeof i.size === "object"
        ? { _id: i.size._id, label: i.size.label }
        : i.size
      : null,
    color: i.color
      ? typeof i.color === "object"
        ? { _id: i.color._id, name: i.color.name }
        : i.color
      : null,
    quantity: clampQty(i.quantity),
  }));
}

// Limpia entradas corruptas y deduplica por variante (sumando cantidades)
function sanitizeCart(cart) {
  if (!Array.isArray(cart)) return [];
  const dedup = new Map();
  for (const raw of cart) {
    const item = {
      product: raw?.product || {},
      size: raw?.size ?? null,
      color: raw?.color ?? null,
      quantity: clampQty(raw?.quantity),
    };
    const { productId, sizeId, colorId } = getIdsFromItem(item);
    if (!productId) continue;
    const key = variantKey(productId, sizeId, colorId);
    const prev = dedup.get(key);
    if (prev) {
      prev.quantity = clampQty(prev.quantity + item.quantity);
    } else {
      dedup.set(key, item);
    }
  }
  return Array.from(dedup.values());
}

// Storage key por usuario
const storageKeyFor = (userId) => (userId ? `cart:${userId}` : null);

export const CartProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const userId = user?.id || user?._id || null;
  const isCustomer = user?.role === "user";

  const [cart, setCart] = useState([]); // estado en memoria

  // Evita persistir justo cuando acabamos de cargar desde storage
  const justLoadedRef = useRef(false);

  // CARGA: reemplazar carrito cuando cambia el usuario o su rol (solo clientes)
  useEffect(() => {
    if (!isCustomer) {
      setCart([]); // si no es cliente (guest/admin) => carrito vacío
      justLoadedRef.current = false;
      return;
    }

    const key = storageKeyFor(userId);
    if (!key) {
      setCart([]); // sin id no persistimos
      justLoadedRef.current = false;
      return;
    }

    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      const cleaned = sanitizeCart(parsed);
      // Reemplaza (NO mezcles) para no duplicar
      setCart(cleaned);
      // Marcamos que acabamos de cargar para que el siguiente efecto no re-escriba inmediatamente
      justLoadedRef.current = true;
    } catch {
      setCart([]);
      justLoadedRef.current = false;
    }
  }, [userId, isCustomer]);

  // PERSISTENCIA: guarda cada cambio (solo clientes)
  useEffect(() => {
    if (!isCustomer) return;
    const key = storageKeyFor(userId);
    if (!key) return;

    // Si venimos justo de cargar, saltamos una escritura para evitar
    // efectos en cascada que pueden causar “duplicado” en algunas apps.
    if (justLoadedRef.current) {
      justLoadedRef.current = false;
      return;
    }

    try {
      localStorage.setItem(key, JSON.stringify(toStorableCart(cart)));
    } catch {
      // storage lleno u otro error → ignorar silencioso
    }
  }, [cart, userId, isCustomer]);

  /**
   * addToCart(product, quantity=1)
   * product puede traer size/color embebidos como objeto o id.
   */
  const addToCart = (product, quantity = 1) => {
    if (!isCustomer) return; // Solo clientes pueden agregar
    const qty = clampQty(quantity);
    if (!product?._id) return;

    const sizeVal = product?.size ?? null;
    const colorVal = product?.color ?? null;
    const sizeId = typeof sizeVal === "object" ? sizeVal?._id : sizeVal;
    const colorId = typeof colorVal === "object" ? colorVal?._id : colorVal;

    setCart((prev) => {
      const key = variantKey(product._id, sizeId, colorId);
      let found = false;

      const next = prev.map((i) => {
        const { productId, sizeId: sId, colorId: cId } = getIdsFromItem(i);
        if (variantKey(productId, sId, cId) === key) {
          found = true;
          return { ...i, quantity: clampQty(i.quantity + qty) };
        }
        return i;
      });

      if (!found) {
        next.push({
          product: {
            _id: product._id,
            name: product.name,
            price: product.price,
            images: Array.isArray(product.images) ? product.images : [],
          },
          size: sizeVal
            ? typeof sizeVal === "object"
              ? { _id: sizeId, label: sizeVal.label }
              : sizeId
            : null,
          color: colorVal
            ? typeof colorVal === "object"
              ? { _id: colorId, name: colorVal.name }
              : colorId
            : null,
          quantity: qty,
        });
      }

      return sanitizeCart(next);
    });
  };

  /**
   * updateItem(productId, sizeId, colorId, newQty)
   */
  const updateItem = (productId, sizeId, colorId, newQty) => {
    if (!isCustomer) return;
    const qty = clampQty(newQty);
    setCart((prev) =>
      sanitizeCart(
        prev.map((i) => {
          const ids = getIdsFromItem(i);
          if (
            ids.productId === productId &&
            String(ids.sizeId || "") === String(sizeId || "") &&
            String(ids.colorId || "") === String(colorId || "")
          ) {
            return { ...i, quantity: qty };
          }
          return i;
        })
      )
    );
  };

  /**
   * removeFromCart(productId, sizeId, colorId)
   */
  const removeFromCart = (productId, sizeId, colorId) => {
    if (!isCustomer) return;
    setCart((prev) =>
      prev.filter((i) => {
        const ids = getIdsFromItem(i);
        return !(
          ids.productId === productId &&
          String(ids.sizeId || "") === String(sizeId || "") &&
          String(ids.colorId || "") === String(colorId || "")
        );
      })
    );
  };

  /**
   * clearCart()
   */
  const clearCart = () => {
    if (!isCustomer) return;
    setCart([]);
  };

  // Por si te resulta útil en la UI
  const totalItems = useMemo(
    () =>
      isCustomer ? cart.reduce((s, i) => s + (Number(i.quantity) || 0), 0) : 0,
    [cart, isCustomer]
  );

  const value = useMemo(
    () => ({
      cart,
      totalItems,
      addToCart,
      updateItem,
      removeFromCart,
      clearCart,
      enabled: isCustomer,
    }),
    [cart, totalItems, isCustomer]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
