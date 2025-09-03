import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import api from "../api/apiClient";
import { useToast } from "../contexts/ToastContext";
import { Link } from "react-router-dom";

export default function ProfilePage() {
  const { user } = useContext(AuthContext); // viene de localStorage/login
  const { showToast } = useToast();
  const [me, setMe] = useState(user || null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancel = false;
    const run = async () => {
      if (!user) {
        setMe(null);
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get("/users/me");
        if (!cancel) setMe(data?.user || user);
      } catch {
        if (!cancel) setMe(user);
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    run();
    return () => {
      cancel = true;
    };
  }, [user]);

  if (!user)
    return (
      <section className="profile-page">
        <h1>Mi Perfil</h1>
        <p>Debes iniciar sesión para ver tu perfil.</p>
      </section>
    );

  const resend = async () => {
    try {
      setSending(true);
      await api.post("/users/resend-verification", {
        email: me?.email || user.email,
      });
      showToast("Te enviamos un nuevo correo de verificación.", "success");
    } catch {
      showToast("No se pudo reenviar el correo", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="profile-page">
      <h1>Mi Perfil</h1>

      {loading ? (
        <p>Cargando…</p>
      ) : (
        <div className="profile-grid">
          <div className="card">
            <h2>Datos</h2>
            <p>
              <b>Nombre:</b> {me?.name}
            </p>
            <p>
              <b>Email:</b> {me?.email}
            </p>
            <p>
              <b>Estado:</b>{" "}
              {me?.isVerified ? (
                <span className="badge badge--ok">Verificado</span>
              ) : (
                <span className="badge badge--warn">No verificado</span>
              )}
            </p>

            {!me?.isVerified && (
              <button
                className="btn btn--primary"
                onClick={resend}
                disabled={sending}
              >
                {sending ? "Enviando…" : "Reenviar verificación"}
              </button>
            )}
          </div>

          {me?.role === "admin" && (
            <div className="card">
              <h2>Panel de administrador</h2>
              <p>Tienes privilegios de administrador.</p>
              <div className="actions">
                <Link to="/admin/users" className="btn btn--ghost">
                  Usuarios
                </Link>
                {/* Puedes añadir más accesos rápidos aquí */}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
