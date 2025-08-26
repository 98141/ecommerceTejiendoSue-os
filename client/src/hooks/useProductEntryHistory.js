import { useEffect, useRef, useState, useContext } from "react";

import apiUrl from '../api/apiClient'

import { AuthContext } from "../contexts/AuthContext";

const debounceFn = (fn, delay = 400) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
};

export function useProductEntryHistory(initialQuery = {}) {
  const { token, user } = useContext(AuthContext);
  const [query, setQuery] = useState({
    page: 1,
    limit: 10,
    sort: "createdAt:desc",
    search: "",
    from: "",
    to: "",
    category: "",
    ...initialQuery
  });
  const [state, setState] = useState({ data: [], total: 0, loading: false, error: null });
  const debouncedFetchRef = useRef();

  useEffect(() => {
    debouncedFetchRef.current = debounceFn(async (q) => {
      if (!token) return;
      setState(s => ({ ...s, loading: true, error: null }));
      try {
        const params = { ...q };
        Object.keys(params).forEach(k => { if (params[k] === "" || params[k] == null) delete params[k]; });
        const { data } = await apiUrl.get("productsHistory/history", {
          headers: { Authorization: `Bearer ${token}` },
          params
        });
        setState({ data: data.data, total: data.total, loading: false, error: null });
      } catch (err) {
        setState(s => ({ ...s, loading: false, error: err?.response?.data?.error || "Error al cargar historial" }));
      }
    }, 450);
  }, [token]);

  useEffect(() => { debouncedFetchRef.current?.(query); }, [query]);

  return { user, query, setQuery, ...state };
}
