import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

export default function RequireAdmin({ children }) {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      showToast("Debes iniciar sesión.", "info");
      navigate("/login", { replace: true });
      return;
    }
    if (user.role !== "admin") {
      showToast("Acceso denegado: solo administradores.", "warning");
      navigate("/", { replace: true });
    }
  }, [user]);

  if (!user || user.role !== "admin") return null;
  return children;
}
