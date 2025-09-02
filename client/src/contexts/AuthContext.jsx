import { createContext, useEffect, useState } from "react";
import api from "../api/apiClient";
import { getToken, setToken as setTokenLS, removeToken } from "../utils/authHelpers";
import { setAccessToken, clearAccessToken } from "../api/tokenStore";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setTokenState] = useState(() => getToken() || "");
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [authReady, setAuthReady] = useState(false);

  // 🔹 Bootstrap de sesión al montar: si hay cookie de refresh, pide un access token nuevo
useEffect(() => {
  (async () => {
    try {
      const { data } = await api.get("/users/refresh-token", { withCredentials: true, __internal: true });
      if (data?.token) {
        setAccessToken(data.token);
        setTokenLS?.(data.token);
        setTokenState(data.token);
      }
      if (data?.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
      }
    } catch {
      // 401: invitado; no pasa nada
    } finally {
      setAuthReady(true);
    }
  })();
}, []);
  const login = (newToken, userData) => {
    // guarda en memoria + (opcional) localStorage
    setAccessToken(newToken);
    setTokenLS?.(newToken);
    setTokenState(newToken);

    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post("/users/logout");
    } catch (error) {
      console.error("Error al cerrar sesión en el backend:", error?.message);
    }
    clearAccessToken();
    removeToken?.();
    localStorage.removeItem("user");
    setTokenState("");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, authReady, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
