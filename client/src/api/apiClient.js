import axios from "axios";
import { getToken, setToken, logout } from "../utils/authHelpers";

// Base desde .env, sin barras finales duplicadas
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true, // cookies httpOnly para refresh
  timeout: 15000,
});

// ---- Helper: rutas públicas (no llevan Authorization) ----
const isPublicPath = (urlPath = "") => {
  const u = urlPath.toLowerCase();
  return (
    u.includes("/users/login") ||
    u.includes("/users/register") ||
    u.includes("/users/refresh-token") ||
    u.includes("/users/forgot-password") ||
    u.includes("/users/reset-password") ||
    u.includes("/users/verify/") ||
    u.includes("/users/resend-verification")
  );
};

// ---- REQUEST: adjunta Bearer solo a rutas NO públicas ----
api.interceptors.request.use((config) => {
  if (!isPublicPath(config.url || "")) {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ---- RESPONSE: refresh token con cola para evitar tormenta de requests ----
let isRefreshing = false;
let refreshQueue = [];
const processQueue = (error, token = null) => {
  refreshQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  refreshQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const msg = (error.response?.data?.error || "").toLowerCase();

    const isAuthError = status === 401 || status === 403;
    const looksLikeJwtIssue = /token|jwt|autoriz/.test(msg);

    if (!isAuthError || original?._retry || !looksLikeJwtIssue) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: (newToken) => {
            if (newToken) original.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(original));
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const { data } = await api.get("/users/refresh-token", {
        withCredentials: true,
      });
      const newToken = data?.token;
      if (!newToken) throw new Error("No se recibió nuevo token");

      setToken(newToken);
      processQueue(null, newToken);

      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      logout();
      if (window.location.pathname !== "/login")
        window.location.href = "/login";
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export const getBaseUrl = () =>
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

export { api, API_BASE_URL };
export default api;
