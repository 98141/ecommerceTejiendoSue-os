import { createContext, useState } from "react";
import { getToken, setToken, removeToken } from "../utils/authHelpers";
import api from "../api/axios"; // ⚠️ Asegúrate de que esté configurado con withCredentials

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = (token, userData) => {
    setToken(token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try {
      // 🔒 Llama al backend para limpiar refreshToken y eliminar la cookie
      await api.post("/users/logout");
    } catch (error) {
      console.error("Error al cerrar sesión en el backend:", error.message);
    }

    // 🔐 Limpia también del lado del cliente
    removeToken();
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
