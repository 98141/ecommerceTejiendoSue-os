import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LoaderOverlay from "../blocks/LoaderOverlay";
import { cancelAllActiveRequests } from "../api/apiClient";

/**
 * GlobalHttpHandler
 * - Overlay por HTTP (eventos http:start/stop/slow) con pequeño delay anti-parpadeo.
 * - Overlay inmediato en CAMBIO DE RUTA (antes del paint) con useLayoutEffect.
 * - Cancela requests al navegar.
 */
export default function GlobalHttpHandler({
  showOnRouteChange = true, // <- ACTIVADO por defecto para tu caso
  routeMinMs = 300,         // tiempo mínimo visible en cambio de ruta (evita flash)
  routeMaxMs = 1200,        // tope para no secuestrar la UX
}) {
  const [pending, setPending] = useState(0);
  const [visible, setVisible] = useState(false); // overlay por HTTP
  const [routeSpin, setRouteSpin] = useState(false); // overlay por cambio de ruta

  const showDelayRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // ---- Overlay por HTTP con delay anti-parpadeo (250ms)
  const ensureShow = () => {
    if (visible || showDelayRef.current) return;
    showDelayRef.current = setTimeout(() => {
      setVisible(true);
      showDelayRef.current = null;
    }, 250);
  };
  const ensureHide = () => {
    if (showDelayRef.current) {
      clearTimeout(showDelayRef.current);
      showDelayRef.current = null;
    }
    setVisible(false);
  };

  // Eventos provenientes de apiCliente (http:start/stop/slow/flush)
  useEffect(() => {
    const onStart = () => { setPending((p) => p + 1); ensureShow(); };
    const onStop  = () => { setPending((p) => Math.max(0, p - 1)); };
    const onSlow  = (e) => {
      if (location.pathname !== "/status/slow") {
        navigate("/status/slow", { state: e.detail, replace: false });
      }
    };
    const onFlush = () => { setPending(0); ensureHide(); };

    window.addEventListener("http:start", onStart);
    window.addEventListener("http:stop", onStop);
    window.addEventListener("http:slow", onSlow);
    window.addEventListener("http:flush", onFlush);
    return () => {
      window.removeEventListener("http:start", onStart);
      window.removeEventListener("http:stop", onStop);
      window.removeEventListener("http:slow", onSlow);
      window.removeEventListener("http:flush", onFlush);
    };
  }, [location.pathname, navigate]);

  // Si no hay pendientes, ocultar overlay HTTP
  useEffect(() => { if (pending <= 0) ensureHide(); }, [pending]);

  // ---- Overlay inmediato en CAMBIO DE RUTA (antes del paint)
  useLayoutEffect(() => {
    // Siempre cancelamos requests colgando
    cancelAllActiveRequests();
    setPending(0);
    ensureHide();

    if (!showOnRouteChange) return;

    // Mostramos overlay *YA* (previo al primer paint de la nueva ruta)
    setRouteSpin(true);

    // Asegura un mínimo visible para no parpadear
    const min = setTimeout(() => setRouteSpin((v) => v && false), routeMinMs);
    // Y un máximo por seguridad
    const max = setTimeout(() => setRouteSpin(false), routeMaxMs);

    return () => { clearTimeout(min); clearTimeout(max); setRouteSpin(false); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Si entran requests reales, dejamos que el overlay-HTTP tome el control
  useEffect(() => {
    if (pending > 0 && routeSpin) setRouteSpin(false);
  }, [pending, routeSpin]);

  const show = visible || routeSpin;
  return <LoaderOverlay visible={show} pending={pending} />;
}
