import { useContext, useEffect, useRef } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { AuthContext } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

const PrivateRoute = ({ allowedRoles = [] }) => {
  // Si tu AuthContext no expone 'loading', el default es false
  const { user, loading = false } = useContext(AuthContext);
  const { showToast } = useToast();
  const location = useLocation();

  // Evitar toasts repetidos (React StrictMode monta/ejecuta efectos 2 veces en dev)
  const didToastRef = useRef(false);

  const notLogged = !loading && !user;
  const unauthorized =
    !loading &&
    user &&
    Array.isArray(allowedRoles) &&
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user.role);

  useEffect(() => {
    if (didToastRef.current) return;

    if (notLogged) {
      didToastRef.current = true;
      showToast("Debes iniciar sesión para acceder", "warning");
    } else if (unauthorized) {
      didToastRef.current = true;
      showToast("Acceso no autorizado", "error");
    }
  }, [notLogged, unauthorized, showToast]);

  // Mientras se determina el estado de auth (opcional)
  if (loading) return null;

  if (notLogged) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location, reason: "auth" }}
      />
    );
  }

  if (unauthorized) {
    return <Navigate to="/" replace state={{ reason: "unauthorized" }} />;
  }

  return <Outlet />;
};

export default PrivateRoute;
