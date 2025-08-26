import { createContext, useState } from "react";
import { getToken, setToken, removeToken } from "../utils/authHelpers";

import apiUrl from "../api/apiClient";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setTokenState] = useState(() => getToken() || "");
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = (newToken, userData) => {
    setToken(newToken); // guarda en localStorage
    setTokenState(newToken); // guarda en memoria
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try {
      await apiUrl.post("/users/logout");
    } catch (error) {
      console.error("Error al cerrar sesión en el backend:", error.message);
    }

    removeToken(); // borra del localStorage
    localStorage.removeItem("user");
    setTokenState(""); // borra en memoria
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
