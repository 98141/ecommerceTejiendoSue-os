import axios from "axios";
import qs from "qs";
import { getToken, setToken, logout } from "../utils/authHelpers";
import { getAccessToken, setAccessToken, clearAccessToken } from "./tokenStore";

/* ===================== Base ===================== */
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  timeout: 15000,
  paramsSerializer: (p) => qs.stringify(p, { arrayFormat: "repeat" }),
});

/* ===================== Eventos / Control ===================== */
const activeControllers = new Map();
const genId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;

// 🔹 NUEVO: serializar solo campos simples
function toSerializable(detail) {
  if (!detail || typeof detail !== "object") return detail;
  const { controller, signal, request, response, ...rest } = detail;
  const out = { ...rest };
  if (out.error instanceof Error) out.error = out.error.message;
  return out;
}

const emit = (type, detail) => {
  try {
    window.dispatchEvent(
      new CustomEvent(`http:${type}`, { detail: toSerializable(detail) })
    );
  } catch {}
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

function cancelAllActiveRequests() {
  for (const [, meta] of activeControllers) {
    try {
      meta.controller.abort();
    } catch {}
  }
  activeControllers.clear();
  emit("flush", { ts: Date.now() });
}

/* ===================== Rutas públicas ===================== */
const isPublicPath = (u = "") => {
  const x = (u || "").toLowerCase();
  return (
    x.includes("/users/login") ||
    x.includes("/users/register") ||
    x.includes("/users/refresh-token") ||
    x.includes("/users/forgot-password") ||
    x.includes("/users/reset-password") ||
    x.includes("/users/verify/") ||
    x.includes("/users/resend-verification")
  );
};

/* ===================== REQUEST ===================== */
api.interceptors.request.use((config) => {
  const isInternal = config.__internal === true; // 🔹 NUEVO

  // Bearer memoria -> localStorage (compat)
  if (!isPublicPath(config.url || "")) {
    const mem = getAccessToken();
    const ls = getToken?.() || null;
    const t = mem || ls;
    if (t) config.headers.Authorization = `Bearer ${t}`;
  }

  // 🔹 si es interna, NO trackeamos ni emitimos eventos
  if (isInternal) return config;

  // AbortController por request + tracking
  const controller = new AbortController();
  config.signal = controller.signal;
  const id = genId();
  const method = (config.method || "get").toUpperCase();
  const url = `${config.baseURL || ""}${config.url || ""}`;
  const startedAt = Date.now();
  const meta = { id, method, url, startedAt, controller, internal: false }; // <- solo datos simples
  config.headers["X-Req-Id"] = id;
  onRequestStart(meta, 15000);

  // DEBUG
  if (import.meta.env.DEV && String(config.url || "").includes("/favorites")) {
    console.log("DBG favorites req:", {
      url: `${config.baseURL || ""}${config.url || ""}`,
      auth: config.headers?.Authorization ? "Bearer present" : "NO AUTH",
    });
  }

  return config;
});

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
    const isInternal = res.config?.__internal === true; // 🔹 NUEVO
    if (!isInternal) {
      const id = res.config?.headers?.["X-Req-Id"];
      const meta = id ? activeControllers.get(id) : null;
      onRequestStop(meta, true, res.status);
    }
    return res;
  },
  async (error) => {
    const original = error.config || {};
    const isInternal = original.__internal === true; // 🔹 NUEVO
    const id = original.headers?.["X-Req-Id"];
    const meta = id ? activeControllers.get(id) : null;

    const status = error.response?.status;
    const msg = (error.response?.data?.error || "").toLowerCase();
    const isAuthError =
      (status === 401 || status === 403) && /token|jwt|autoriz/.test(msg);

    if (!isAuthError || original._retry) {
      if (!isInternal) onRequestStop(meta, false, status);
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
      // 🔹 refresh interno y silencioso
      const { data } = await api.get("/users/refresh-token", {
        withCredentials: true,
        __internal: true,
      });
      const newToken = data?.token;
      if (!newToken) throw new Error("No se recibió nuevo token");

      setAccessToken(newToken);
      setToken?.(newToken);

      processQueue(null, newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      if (!isInternal) onRequestStop(meta, false, status);
      return api(original);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      clearAccessToken();
      logout?.();
      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/login"
      ) {
        window.location.href = "/login";
      }
      if (!isInternal) onRequestStop(meta, false, status);
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

/* ===================== Utils export ===================== */
export const getBaseUrl = () =>
  (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(
    /\/api\/?$/,
    ""
  );

export { api, API_BASE_URL, cancelAllActiveRequests };
export default api;
