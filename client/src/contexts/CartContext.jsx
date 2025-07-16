import { createContext, useState } from "react";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = (product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(
        item =>
          item.product._id === product._id &&
          item.size._id === product.size._id &&
          item.color._id === product.color._id
      );

      if (existing) {
        return prev.map(item =>
          item.product._id === product._id &&
          item.size._id === product.size._id &&
          item.color._id === product.color._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [
        ...prev,
        {
          product,
          quantity,
          size: product.size,   // { _id, label }
          color: product.color  // { _id, name }
        }
      ];
    });
  };

  const updateItem = (productId, sizeId, colorId, newQty) => {
    setCart(prev =>
      prev.map(item =>
        item.product._id === productId &&
        item.size._id === sizeId &&
        item.color._id === colorId
          ? { ...item, quantity: newQty }
          : item
      )
    );
  };

  const removeFromCart = (productId, sizeId, colorId) => {
    setCart(prev =>
      prev.filter(
        item =>
          item.product._id !== productId ||
          item.size._id !== sizeId ||
          item.color._id !== colorId
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

