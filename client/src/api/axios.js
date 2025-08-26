import axios from "axios";
import { getToken, setToken, logout } from "../utils/authHelpers";

// Axios personalizado
const api = axios.create({
  baseURL: "http://localhost:5000/api",
  // permite enviar cookies httpOnly
  withCredentials: true 
});

// Interceptor para renovar accessToken automáticamente
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 403 &&
      !originalRequest._retry &&
      error.response.data?.error?.includes("Token")
    ) {
      originalRequest._retry = true;

      try {
        const res = await axios.get("http://localhost:5000/api/users/refresh-token", {
          withCredentials: true
        });

        const newToken = res.data.token;
        setToken(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        // Reintenta con nuevo token
        return api(originalRequest); 
      } catch (refreshError) {
        logout(); // Limpia sesión
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
