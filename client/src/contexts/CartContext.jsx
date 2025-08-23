// src/contexts/CartContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";

export const CartContext = createContext();

// Límite máximo por ítem (ajústalo a tu negocio)
const MAX_QTY_PER_ITEM = 20;

// Clave temporal de “último carrito” (buffer durante la hidratación de Auth)
const LAST_CART_KEY = "cart:last";

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

// Extrae ids de forma segura
function getIdsFromItem(item) {
  return {
    productId: item?.product?._id,
    sizeId: item?.size?._id ?? item?.size ?? null,
    colorId: item?.color?._id ?? item?.color ?? null,
  };
}

// Serializa solo lo esencial
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

// Limpia entradas corruptas/duplicadas
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

// Une dos carritos (suma cantidades por variante)
function mergeCarts(a, b) {
  return sanitizeCart([
    ...(Array.isArray(a) ? a : []),
    ...(Array.isArray(b) ? b : []),
  ]);
}

// Construye la clave de storage por usuario
const storageKeyFor = (userId) => (userId ? `cart:${userId}` : null);

// Lee buffer de “último carrito”
function readLastCart() {
  try {
    const raw = localStorage.getItem(LAST_CART_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // opcionalmente podrías validar antigüedad con parsed.ts
    return {
      userId: parsed?.userId ?? null,
      items: sanitizeCart(parsed?.items ?? []),
    };
  } catch {
    return null;
  }
}

// Escribe buffer de “último carrito”
function writeLastCart(userId, cart) {
  try {
    localStorage.setItem(
      LAST_CART_KEY,
      JSON.stringify({
        userId: userId ?? null,
        items: toStorableCart(cart),
        ts: Date.now(),
      })
    );
  } catch {
    // ignorar
  }
}

// Limpia buffer
function clearLastCart() {
  try {
    localStorage.removeItem(LAST_CART_KEY);
  } catch {
    // ignorar
  }
}

export const CartProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const userId = user?.id || user?._id || null;
  const isCustomer = user?.role === "user";

  // 1) Estado del carrito (inicia desde el buffer para evitar “pérdida” visual tras recargar)
  const [cart, setCart] = useState(() => {
    const last = readLastCart();
    return last?.items ?? [];
  });

  // 2) Cuando ya sabemos que es cliente, cargar su carrito desde su clave específica y
  //    unir con lo que estuviera en el buffer (si existe), luego limpiar el buffer.
  useEffect(() => {
    if (!isCustomer) {
      // No cliente: mantener en memoria lo que hay (no se mostrará en UI si ocultas)
      // También puedes limpiar si prefieres: setCart([]);
      return;
    }
    const key = storageKeyFor(userId);
    if (!key) return;

    try {
      const raw = localStorage.getItem(key);
      const userCart = sanitizeCart(raw ? JSON.parse(raw) : []);
      const last = readLastCart();

      let merged = userCart;
      if (last?.items?.length) {
        // Si el buffer pertenece al mismo userId o es anónimo, únelo
        if (!last.userId || last.userId === userId) {
          merged = mergeCarts(userCart, last.items);
        }
      }

      setCart(merged);
      // Guarda inmediatamente y limpia buffer
      localStorage.setItem(key, JSON.stringify(toStorableCart(merged)));
      clearLastCart();
    } catch {
      // si falla parsing, deja el estado actual
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isCustomer]);

  // 3) Persistir cambios:
  //    - Si es cliente → guarda en su clave y también en el buffer (para rehidratación suave)
  //    - Si no es cliente → solo buffer (no se mostrará, pero evita “saltos” si Auth se hidrata)
  useEffect(() => {
    if (isCustomer) {
      const key = storageKeyFor(userId);
      if (key) {
        try {
          localStorage.setItem(key, JSON.stringify(toStorableCart(cart)));
        } catch {}
      }
      writeLastCart(userId, cart);
    } else {
      // invitado o admin: escribe solo buffer; UI del carrito debería estar oculta para admin
      writeLastCart(null, cart);
    }
  }, [cart, userId, isCustomer]);

  /**
   * addToCart(product, quantity=1)
   */
  const addToCart = (product, quantity = 1) => {
    // Solo clientes deben poder agregar (seguridad UX)
    if (!isCustomer) return;
    const qty = clampQty(quantity);
    const size = product?.size ?? null;
    const color = product?.color ?? null;

    if (!product?._id) return;

    const sizeId = typeof size === "object" ? size?._id : size;
    const colorId = typeof color === "object" ? color?._id : color;

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
          size: size
            ? typeof size === "object"
              ? { _id: sizeId, label: size.label }
              : sizeId
            : null,
          color: color
            ? typeof color === "object"
              ? { _id: colorId, name: color.name }
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
