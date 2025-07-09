import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

const PrivateRoute = ({ allowedRoles }) => {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();

  // No está logueado
  if (!user) {
    showToast("Debes iniciar sesión para acceder", "warning");
    return <Navigate to="/login" replace />;
  }

  // No tiene el rol permitido
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    showToast("Acceso no autorizado", "error");
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
