import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AuthContext } from "./AuthContext";

/** Ajusta según tu server (si tienes proxy, deja "/api") */
const API_BASE = "http://localhost:5000/api";
const GUEST_LS_KEY = "guest_cart_v1";

// eslint-disable-next-line react-refresh/only-export-components
export const CartContext = createContext();

/* ================= Utilidades ================= */

const MAX_QTY_PER_ITEM = 20;
const clampQty = (q) => Math.max(1, Math.min(MAX_QTY_PER_ITEM, Number(q) || 0));

const variantKey = (productId, sizeId, colorId) =>
  `${String(productId)}::${String(sizeId || "")}::${String(colorId || "")}`;

function getIdsFromAny(itemOrProduct) {
  const size = itemOrProduct?.size ?? itemOrProduct?.sizeId ?? null;
  const color = itemOrProduct?.color ?? itemOrProduct?.colorId ?? null;

  return {
    productId:
      itemOrProduct?.product?._id ??
      itemOrProduct?._id ??
      itemOrProduct?.productId,
    sizeId: typeof size === "object" ? size?._id : size ?? null,
    colorId: typeof color === "object" ? color?._id : color ?? null,
  };
}

function sanitizeCartItems(items) {
  if (!Array.isArray(items)) return [];
  const dedup = new Map();

  for (const raw of items) {
    const { productId, sizeId, colorId } = getIdsFromAny(raw);
    if (!productId) continue;
    const quantity = clampQty(raw?.quantity);
    const key = variantKey(productId, sizeId, colorId);
    const prev = dedup.get(key);
    if (prev) {
      prev.quantity = clampQty(prev.quantity + quantity);
    } else {
      dedup.set(key, {
        productId: String(productId),
        sizeId: sizeId ? String(sizeId) : null,
        colorId: colorId ? String(colorId) : null,
        quantity,
      });
    }
  }
  return Array.from(dedup.values());
}

function toGuestStorage(items) {
  return items.map(({ productId, sizeId, colorId, quantity }) => ({
    productId,
    sizeId,
    colorId,
    quantity: clampQty(quantity),
  }));
}

function readGuestCart() {
  try {
    const raw = localStorage.getItem(GUEST_LS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return sanitizeCartItems(parsed);
  } catch {
    return [];
  }
}

function writeGuestCart(items) {
  try {
    localStorage.setItem(GUEST_LS_KEY, JSON.stringify(toGuestStorage(items)));
  } catch {}
}

function clearGuestCart() {
  try {
    localStorage.removeItem(GUEST_LS_KEY);
  } catch {}
}

/* =============== Fetch helper con ETag =============== */

async function apiFetch(path, { method = "GET", body, token, ifMatch } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (ifMatch) headers["If-Match"] = ifMatch;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  const etag = res.headers.get("ETag");
  let data = null;
  try {
    data = await res.json();
  } catch {}

  if (!res.ok) {
    const err = new Error(data?.error || data?.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    err.etag = etag;
    throw err;
  }

  return { data, etag };
}

/* =============== Provider =============== */

export const CartProvider = ({ children }) => {
  const { user, token: ctxToken } = useContext(AuthContext);
  const getToken = () => ctxToken || user?.token || user?.accessToken || null;

  const isCustomer = user?.role === "user" && Boolean(getToken());
  const userId = user?.id || user?._id || null;

  // Estado "canónico" (remoto o invitado): solo IDs + cantidad
  const [cart, setCart] = useState([]); // [{ productId, sizeId, colorId, quantity }]
  const [mode, setMode] = useState("guest"); // "guest" | "remote"
  const etagRef = useRef(null);
  const retryingRef = useRef(false);

  /* ---- Hidratación según sesión ---- */
  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      if (!isCustomer) {
        const local = readGuestCart();
        if (!isMounted) return;
        setCart(local);
        setMode("guest");
        etagRef.current = null;
        return;
      }

      const token = getToken();
      try {
        const guest = readGuestCart();
        if (guest.length) {
          const { data, etag } = await apiFetch("/cart/merge", {
            method: "POST",
            token,
            body: {
              items: guest.map(({ productId, sizeId, colorId, quantity }) => ({
                productId,
                sizeId,
                colorId,
                quantity,
              })),
            },
          });
          clearGuestCart();
          if (!isMounted) return;
          setCart(sanitizeCartItems(data?.items || []));
          setMode("remote");
          etagRef.current = etag;
        } else {
          const { data, etag } = await apiFetch("/cart", { token });
          if (!isMounted) return;
          setCart(sanitizeCartItems(data?.items || []));
          setMode("remote");
          etagRef.current = etag;
        }
      } catch {
        const local = readGuestCart();
        if (!isMounted) return;
        setCart(local);
        setMode("guest");
        etagRef.current = null;
      }
    }

    hydrate();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isCustomer]);

  /* ---- Persistencia en invitado ---- */
  useEffect(() => {
    if (mode === "guest") writeGuestCart(cart);
  }, [cart, mode]);

  /* ---- Acciones ---- */

  const addToCart = async (product, quantity = 1) => {
    const { productId, sizeId, colorId } = getIdsFromAny(product);
    const qty = clampQty(quantity);
    if (!productId) return;

    if (mode === "remote") {
      const token = getToken();
      try {
        const { data, etag } = await apiFetch("/cart/items", {
          method: "POST",
          token,
          body: { productId, sizeId, colorId, quantity: qty },
        });
        setCart(sanitizeCartItems(data?.items || []));
        etagRef.current = etag;
        return;
      } catch (err) {
        if (err.status === 401 || err.status === 403) {
          setMode("guest");
        } else {
          throw err;
        }
      }
    }

    setCart((prev) => {
      const next = [...prev];
      const key = variantKey(productId, sizeId, colorId);
      const idx = next.findIndex(
        (i) => variantKey(i.productId, i.sizeId, i.colorId) === key
      );
      if (idx === -1) next.push({ productId, sizeId, colorId, quantity: qty });
      else
        next[idx] = {
          ...next[idx],
          quantity: clampQty(next[idx].quantity + qty),
        };
      return sanitizeCartItems(next);
    });
  };

  const updateItem = async (productId, sizeId, colorId, newQty) => {
    const qty = clampQty(newQty);

    if (mode === "remote") {
      const token = getToken();
      try {
        const { data, etag } = await apiFetch("/cart/items", {
          method: "PATCH",
          token,
          ifMatch: etagRef.current,
          body: { productId, sizeId, colorId, quantity: qty },
        });
        setCart(sanitizeCartItems(data?.items || []));
        etagRef.current = etag;
        retryingRef.current = false;
        return;
      } catch (err) {
        if (err.status === 412 && !retryingRef.current) {
          retryingRef.current = true;
          try {
            const { data, etag } = await apiFetch("/cart", { token });
            setCart(sanitizeCartItems(data?.items || []));
            etagRef.current = etag;
            const r2 = await apiFetch("/cart/items", {
              method: "PATCH",
              token,
              ifMatch: etagRef.current,
              body: { productId, sizeId, colorId, quantity: qty },
            });
            setCart(sanitizeCartItems(r2.data?.items || []));
            etagRef.current = r2.etag;
          } finally {
            retryingRef.current = false;
          }
          return;
        }
        if (err.status === 401 || err.status === 403) {
          setMode("guest");
        } else {
          throw err;
        }
      }
    }

    setCart((prev) =>
      sanitizeCartItems(
        prev.map((i) => {
          if (
            i.productId === productId &&
            String(i.sizeId || "") === String(sizeId || "") &&
            String(i.colorId || "") === String(colorId || "")
          ) {
            return { ...i, quantity: qty };
          }
          return i;
        })
      )
    );
  };

  const removeFromCart = async (productId, sizeId, colorId) => {
    if (mode === "remote") {
      const token = getToken();
      try {
        const { data, etag } = await apiFetch("/cart/items", {
          method: "DELETE",
          token,
          ifMatch: etagRef.current,
          body: { productId, sizeId, colorId },
        });
        setCart(sanitizeCartItems(data?.items || []));
        etagRef.current = etag;
        retryingRef.current = false;
        return;
      } catch (err) {
        if (err.status === 412 && !retryingRef.current) {
          retryingRef.current = true;
          try {
            const { data, etag } = await apiFetch("/cart", { token });
            setCart(sanitizeCartItems(data?.items || []));
            etagRef.current = etag;
            const r2 = await apiFetch("/cart/items", {
              method: "DELETE",
              token,
              ifMatch: etagRef.current,
              body: { productId, sizeId, colorId },
            });
            setCart(sanitizeCartItems(r2.data?.items || []));
            etagRef.current = r2.etag;
          } finally {
            retryingRef.current = false;
          }
          return;
        }
        if (err.status === 401 || err.status === 403) {
          setMode("guest");
        } else {
          throw err;
        }
      }
    }

    setCart((prev) =>
      prev.filter(
        (i) =>
          !(
            i.productId === productId &&
            String(i.sizeId || "") === String(sizeId || "") &&
            String(i.colorId || "") === String(colorId || "")
          )
      )
    );
  };

  const clearCart = async () => {
    if (mode === "remote") {
      const token = getToken();
      try {
        const { data, etag } = await apiFetch("/cart", { token });
        etagRef.current = etag;
        const items = sanitizeCartItems(data?.items || []);
        for (const it of items) {
          const r = await apiFetch("/cart/items", {
            method: "DELETE",
            token,
            ifMatch: etagRef.current,
            body: {
              productId: it.productId,
              sizeId: it.sizeId,
              colorId: it.colorId,
            },
          });
          setCart(sanitizeCartItems(r.data?.items || []));
          etagRef.current = r.etag;
        }
      } catch (err) {
        if (err.status === 401 || err.status === 403) {
          setMode("guest");
          setCart([]);
        } else {
          throw err;
        }
      }
      return;
    }

    setCart([]);
  };

  const totalItems = useMemo(
    () => cart.reduce((s, i) => s + (Number(i.quantity) || 0), 0),
    [cart]
  );

  /** ========= Capa de compatibilidad para UI antigua =========
   * cartLegacy emula la forma previa:
   * {
   *   product: { _id },
   *   size:    { _id } | null,
   *   color:   { _id } | null,
   *   quantity
   * }
   * Úsalo temporalmente: const { cartLegacy } = useContext(CartContext)
   */
  const cartLegacy = useMemo(
    () =>
      cart.map((i) => ({
        product: i.productId ? { _id: i.productId } : null,
        size: i.sizeId ? { _id: i.sizeId } : null,
        color: i.colorId ? { _id: i.colorId } : null,
        quantity: i.quantity,
      })),
    [cart]
  );

  const value = useMemo(
    () => ({
      // Nuevo formato canónico
      cart, // [{ productId, sizeId, colorId, quantity }]
      totalItems,
      mode, // "guest" | "remote"
      addToCart,
      updateItem,
      removeFromCart,
      clearCart,
      // Compat temporal (para que CartPage no rompa)
      cartLegacy, // <- usa este en tu CartPage actual
    }),
    [cart, totalItems, mode, cartLegacy]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
