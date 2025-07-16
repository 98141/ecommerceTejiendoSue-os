import { createContext, useState } from "react";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]); // [{ product, quantity, size, color }]

  const addToCart = (product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(
        item =>
          item.product._id === product._id &&
          item.size === product.size &&
          item.color === product.color
      );

      if (existing) {
        return prev.map(item =>
          item.product._id === product._id &&
          item.size === product.size &&
          item.color === product.color
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [
        ...prev,
        {
          product,
          quantity,
          size: product.size,
          color: product.color
        }
      ];
    });
  };

  const updateItem = (productId, size, color, newQty) => {
    setCart(prev =>
      prev.map(item =>
        item.product._id === productId &&
        item.size === size &&
        item.color === color
          ? { ...item, quantity: newQty }
          : item
      )
    );
  };

  const removeFromCart = (productId, size, color) => {
    setCart(prev =>
      prev.filter(
        item =>
          item.product._id !== productId ||
          item.size !== size ||
          item.color !== color
      )
    );
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, updateItem, removeFromCart, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};
