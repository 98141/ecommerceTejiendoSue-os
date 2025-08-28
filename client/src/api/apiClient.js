// src/api/apiClient.js
import axios from "axios";
import { getToken, setToken, logout } from "../utils/authHelpers";

/* ===================== Base ===================== */
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true, // cookies httpOnly para refresh
  timeout: 15000, // hard-timeout (además del watchdog)
});

/* ===================== Eventos / Control ===================== */
const activeControllers = new Map(); // reqId -> { controller, startedAt, url, method, slowTimer }
const genId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;

const emit = (type, detail) => {
  try {
    window.dispatchEvent(new CustomEvent(`http:${type}`, { detail }));
  } catch {
    // no-op (SSR o tests)
  }
};

function onRequestStart(meta, slowMs = 15000) {
  emit("start", meta);
  const slowTimer = setTimeout(() => {
    emit("slow", { ...meta, elapsed: Date.now() - meta.startedAt });
  }, slowMs);
  meta.slowTimer = slowTimer;
  activeControllers.set(meta.id, meta);
}

function onRequestStop(meta, ok, status) {
  if (!meta) return;
  try {
    if (meta.slowTimer) clearTimeout(meta.slowTimer);
  } catch {}
  activeControllers.delete(meta.id);
  emit("stop", { ...meta, endedAt: Date.now(), ok: !!ok, status: status ?? 0 });
}

export function cancelAllActiveRequests() {
  for (const [, meta] of activeControllers) {
    try {
      meta.controller.abort();
    } catch {}
  }
  activeControllers.clear();
  emit("flush", { ts: Date.now() });
}

/* ===================== Rutas públicas ===================== */
const isPublicPath = (urlPath = "") => {
  const u = (urlPath || "").toLowerCase();
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

/* ===================== REQUEST ===================== */
api.interceptors.request.use(
  (config) => {
    // Bearer sólo si no es ruta pública
    if (!isPublicPath(config.url || "")) {
      const token = getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }

    // AbortController por request
    const controller = new AbortController();
    config.signal = controller.signal;

    // Metadatos para loader/slow
    const id = genId();
    const method = (config.method || "get").toUpperCase();
    const url = `${config.baseURL || ""}${config.url || ""}`;
    const startedAt = Date.now();
    const meta = { id, method, url, startedAt, controller };

    // Marcar la request
    config.headers["X-Req-Id"] = id;

    // Iniciar tracking + watchdog
    onRequestStart(meta, 15000);

    return config;
  },
  (error) => Promise.reject(error)
);

/* ===================== RESPONSE (refresh con cola) ===================== */
let isRefreshing = false;
let refreshQueue = [];
const processQueue = (error, token = null) => {
  refreshQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  refreshQueue = [];
};

api.interceptors.response.use(
  (res) => {
    const id = res.config?.headers?.["X-Req-Id"];
    const meta = id ? activeControllers.get(id) : null;
    onRequestStop(meta, true, res.status);
    return res;
  },
  async (error) => {
    const original = error.config || {};
    const id = original.headers?.["X-Req-Id"];
    const meta = id ? activeControllers.get(id) : null;

    const status = error.response?.status;
    const msg = (error.response?.data?.error || "").toLowerCase();

    const isAuthError = status === 401 || status === 403;
    const looksLikeJwtIssue = /token|jwt|autoriz/.test(msg);

    // Si no es caso de refresh, cerramos tracking y devolvemos error
    if (!isAuthError || original._retry || !looksLikeJwtIssue) {
      onRequestStop(meta, false, status);
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      // En cola hasta que termine el refresh
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
      // NOTA: ruta pública → no requiere Bearer
      const { data } = await api.get("/users/refresh-token", {
        withCredentials: true,
      });
      const newToken = data?.token;
      if (!newToken) throw new Error("No se recibió nuevo token");

      setToken(newToken);
      processQueue(null, newToken);

      original.headers.Authorization = `Bearer ${newToken}`;
      onRequestStop(meta, false, status); // cerramos tracking de la original fallida
      return api(original);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      logout();
      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/login"
      ) {
        window.location.href = "/login";
      }
      onRequestStop(meta, false, status);
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

/* ===================== Utils export ===================== */
export const getBaseUrl = () =>
  (import.meta.env.VITE_API_URL || "http://localhost:5000").replace("/api", "");

export { api, API_BASE_URL };
export default api;
