import { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

const PrivateRoute = ({ allowedRoles }) => {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const location = useLocation();

  if (!user) {
    showToast("Debes iniciar sesión para acceder", "warning");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    showToast("Acceso no autorizado", "error");
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
