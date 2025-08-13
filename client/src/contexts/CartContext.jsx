// contexts/CartContext.jsx
import { createContext, useEffect, useMemo, useState } from "react";

export const CartContext = createContext();

// Cambia el prefijo por el de tu proyecto si lo deseas
const LS_KEY = "rt_cart_v1";
const MAX_QTY_PER_ITEM = 20; // límite razonable por ítem (ajústalo a tu negocio)

function clampQty(q) {
  const n = Number(q) || 0;
  return Math.max(1, Math.min(MAX_QTY_PER_ITEM, n));
}

// Construye una clave única por variante
function variantKey(productId, sizeId, colorId) {
  return `${String(productId)}::${String(sizeId || "")}::${String(
    colorId || ""
  )}`;
}

// Extrae ids de forma segura (tolerante a que size/color no existan)
function getIdsFromItem(item) {
  return {
    productId: item?.product?._id,
    sizeId: item?.size?._id,
    colorId: item?.color?._id,
  };
}

// Evita guardar en storage objetos gigantes o con referencias innecesarias
// (si tu objeto product tiene mucha info, puedes filtrar aquí lo esencial)
function toStorableCart(cart) {
  return cart.map((i) => ({
    product: {
      _id: i.product?._id,
      name: i.product?.name,
      price: i.product?.price,
      images: Array.isArray(i.product?.images) ? i.product.images : [],
    },
    size: i.size ? { _id: i.size._id, label: i.size.label } : null,
    color: i.color ? { _id: i.color._id, name: i.color.name } : null,
    quantity: clampQty(i.quantity),
  }));
}

// Limpia entradas corruptas o incompletas
function sanitizeCart(cart) {
  if (!Array.isArray(cart)) return [];
  const dedup = new Map();
  for (const raw of cart) {
    const item = {
      product: raw?.product || {},
      size: raw?.size || null,
      color: raw?.color || null,
      quantity: clampQty(raw?.quantity),
    };
    const { productId, sizeId, colorId } = getIdsFromItem(item);
    if (!productId) continue; // sin producto no tiene sentido
    const key = variantKey(productId, sizeId, colorId);
    const prev = dedup.get(key);
    if (prev) {
      // si ya existe, suma cantidades siempre respetando el máximo por ítem
      prev.quantity = clampQty(prev.quantity + item.quantity);
    } else {
      dedup.set(key, item);
    }
  }
  return Array.from(dedup.values());
}

export const CartProvider = ({ children }) => {
  // Carga inicial desde localStorage
  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return sanitizeCart(parsed);
    } catch {
      return [];
    }
  });

  // Persiste cada cambio
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(toStorableCart(cart)));
    } catch {
      // si el storage está lleno u otro error, lo ignoramos silenciosamente
    }
  }, [cart]);

  /**
   * addToCart(product, quantity=1)
   * Mantiene compatibilidad con tu uso actual: el "product" trae size y color embebidos.
   * Estructura esperada:
   *  - product: { _id, name, price, images?, size: {_id, label}, color: {_id, name} }
   */
  const addToCart = (product, quantity = 1) => {
    const qty = clampQty(quantity);
    const size = product?.size || null;
    const color = product?.color || null;

    if (!product?._id) return; // Fail-safe

    setCart((prev) => {
      const key = variantKey(product._id, size?._id, color?._id);
      let found = false;
      const next = prev.map((i) => {
        const { productId, sizeId, colorId } = getIdsFromItem(i);
        if (variantKey(productId, sizeId, colorId) === key) {
          found = true;
          return { ...i, quantity: clampQty(i.quantity + qty) };
        }
        return i;
      });

      if (!found) {
        next.push({
          product,
          size: size ? { _id: size._id, label: size.label } : null,
          color: color ? { _id: color._id, name: color.name } : null,
          quantity: qty,
        });
      }

      return sanitizeCart(next);
    });
  };

  /**
   * updateItem(productId, sizeId, colorId, newQty)
   * Estás llamando esto desde CartPage/CartItem.
   */
  const updateItem = (productId, sizeId, colorId, newQty) => {
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
  const clearCart = () => setCart([]);

  const value = useMemo(
    () => ({ cart, addToCart, updateItem, removeFromCart, clearCart }),
    [cart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
