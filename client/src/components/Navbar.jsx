import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { CartContext } from "../contexts/CartContext";
import { SupportContext } from "../contexts/SupportContext";
import { useToast } from "../contexts/ToastContext";
import ConfirmModal from "../blocks/ConfirmModalBlock";
import logo from "../assets/PPFINAL.png";

/* ==================== Helpers de "ruta activa" ==================== */
const isMatch = (pathname, matcher) => {
  if (!matcher) return false;
  if (matcher instanceof RegExp) return matcher.test(pathname);
  if (typeof matcher === "string") {
    if (matcher === "/") return pathname === "/";
    return pathname === matcher || pathname.startsWith(matcher + "/");
  }
  if (Array.isArray(matcher)) return matcher.some((m) => isMatch(pathname, m));
  return false;
};
/* ================================================================= */

/** ===================== MENÚ CONFIG ===================== */
const menuConfig = ({ role, totalItems, hidePublic }) => {
  const publicGroup = hidePublic
    ? []
    : [
        { label: "Inicio", to: "/", activeMatch: /^\/$/ },
        {
          label: "Artesanías",
          to: "/artesanias",
          activeMatch: /^\/artesanias(\/|$)/,
          children: [
            {
              label: "Sombreros de Iraca",
              to: "/artesanias/sombreros",
              activeMatch: /^\/artesanias\/sombreros(\/|$)/,
            },
            {
              label: "Accesorios",
              to: "/artesanias/accesorios",
              activeMatch: /^\/artesanias\/accesorios(\/|$)/,
            },
            {
              label: "Colecciones",
              to: "/artesanias/colecciones",
              activeMatch: /^\/artesanias\/colecciones(\/|$)/,
            },
          ],
        },
        {
          label: "Café",
          to: "/cafe",
          activeMatch: /^\/cafe(\/|$)/,
          children: [
            {
              label: "Origen Nariño",
              to: "/cafe/narino",
              activeMatch: /^\/cafe\/narino(\/|$)/,
            },
            {
              label: "Tostiones",
              to: "/cafe/tostiones",
              activeMatch: /^\/cafe\/tostiones(\/|$)/,
            },
            {
              label: "Métodos",
              to: "/cafe/metodos",
              activeMatch: /^\/cafe\/metodos(\/|$)/,
            },
          ],
        },
        {
          label: "Panela",
          to: "/panela",
          activeMatch: /^\/panela(\/|$)/,
          children: [
            {
              label: "Trapiche",
              to: "/panela/tradicion",
              activeMatch: /^\/panela\/tradicion(\/|$)/,
            },
            {
              label: "Presentaciones",
              to: "/panela/presentaciones",
              activeMatch: /^\/panela\/presentaciones(\/|$)/,
            },
            {
              label: "Recetas",
              to: "/panela/recetas",
              activeMatch: /^\/panela\/recetas(\/|$)/,
            },
          ],
        },
      ];

  const userOnly =
    role === "user"
      ? [
          { label: "Inicio", to: "/", activeMatch: /^\/$/ },
          {
            label: "Artesanías",
            to: "/artesanias",
            activeMatch: /^\/artesanias(\/|$)/,
            children: [
              {
                label: "Sombreros de Iraca",
                to: "/artesanias/sombreros",
                activeMatch: /^\/artesanias\/sombreros(\/|$)/,
              },
              {
                label: "Accesorios",
                to: "/artesanias/accesorios",
                activeMatch: /^\/artesanias\/accesorios(\/|$)/,
              },
              {
                label: "Colecciones",
                to: "/artesanias/colecciones",
                activeMatch: /^\/artesanias\/colecciones(\/|$)/,
              },
            ],
          },
          {
            label: "Café",
            to: "/cafe",
            activeMatch: /^\/cafe(\/|$)/,
            children: [
              {
                label: "Origen Nariño",
                to: "/cafe/narino",
                activeMatch: /^\/cafe\/narino(\/|$)/,
              },
              {
                label: "Tostiones",
                to: "/cafe/tostiones",
                activeMatch: /^\/cafe\/tostiones(\/|$)/,
              },
              {
                label: "Métodos",
                to: "/cafe/metodos",
                activeMatch: /^\/cafe\/metodos(\/|$)/,
              },
            ],
          },
          {
            label: "Panela",
            to: "/panela",
            activeMatch: /^\/panela(\/|$)/,
            children: [
              {
                label: "Trapiche",
                to: "/panela/tradicion",
                activeMatch: /^\/panela\/tradicion(\/|$)/,
              },
              {
                label: "Presentaciones",
                to: "/panela/presentaciones",
                activeMatch: /^\/panela\/presentaciones(\/|$)/,
              },
              {
                label: "Recetas",
                to: "/panela/recetas",
                activeMatch: /^\/panela\/recetas(\/|$)/,
              },
            ],
          },
          {
            label: `Carrito (${totalItems})`,
            to: "/cart",
            activeMatch: /^\/cart(\/|$)/,
          },
          {
            label: "Mis pedidos",
            to: "/my-orders",
            activeMatch: /^\/my-orders(\/|$)/,
          },
        ]
      : [];

  const adminOnly =
    role === "admin"
      ? [
          {
            label: "Dashboard",
            to: "/admin/dashboard",
            activeMatch: /^\/admin\/dashboard(\/|$)/,
          },
          { label: "Pedidos", to: "/admin", activeMatch: /^\/admin\/?$/ }, // exacto
          {
            label: "Historial",
            to: "/admin/orders",
            activeMatch: /^\/admin\/orders(\/|$)/,
          },
          {
            label: "Productos",
            to: "/admin/products",
            activeMatch: /^\/admin\/products(\/|$)/,
          },
        ]
      : [];

  if (role === "admin") return adminOnly;
  if (role === "user") return userOnly;
  return publicGroup;
};
/** ======================================================= */

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const { unreadCount } = useContext(SupportContext);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [showConfirm, setShowConfirm] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // desktop/tablet
  const [drawerOpen, setDrawerOpen] = useState(false); // móvil
  const [mobileOpenIndex, setMobileOpenIndex] = useState(null); // acordeón móvil

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const navRef = useRef(null);

  const isAdminRoute = location.pathname.startsWith("/admin");
  const hidePublic = isAdminRoute || Boolean(user);

  const capitalizeInitials = (name) =>
    (name || "")
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

  // Cerrar dropdowns/drawer con click fuera y Esc
  useEffect(() => {
    const onClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    const onEsc = (e) => {
      if (e.key === "Escape") {
        setOpenDropdown(null);
        setDrawerOpen(false);
        setMobileOpenIndex(null);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const items = menuConfig({ role: user?.role, totalItems, hidePublic });

  const goSupportPath = user
    ? user.role === "admin"
      ? "/admin/inbox"
      : "/support"
    : "/login";
  const isSupportActive =
    isMatch(location.pathname, /^\/support(\/|$)/) ||
    isMatch(location.pathname, /^\/admin\/inbox(\/|$)/);

  const handleLogoutConfirm = async () => {
    await logout();
    showToast("Sesión cerrada correctamente", "success");
    navigate("/");
  };

  // Desktop/Tablet: al clic, abre y PERMANECE hasta clic fuera o selección
  const onTopItemClick = (item, idx, hasChildren) => {
    if (window.innerWidth < 768) return;
    if (!hasChildren) {
      navigate(item.to);
      return;
    }
    setOpenDropdown((cur) => (cur === idx ? null : idx));
  };

  // Móvil: acordeón controlado
  const onMobileParentClick = (item, idx) => {
    if (!item.children) {
      navigate(item.to);
      setDrawerOpen(false);
      setMobileOpenIndex(null);
      return;
    }
    setMobileOpenIndex((cur) => (cur === idx ? null : idx));
  };

  return (
    <>
      <nav className="navbar-container" ref={navRef}>
        {/* IZQUIERDA: LOGO */}
        <div className="nav-left">
          <Link
            to={user ? (user.role === "admin" ? "/admin/dashboard" : "/") : "/"}
            className="brand"
          >
            <img src={logo} alt="Tejiendo Raíces" className="brand-logo" />
            <span className="brand-name">Tejiendo&nbsp;Raíces</span>
          </Link>
        </div>

        {/* CENTRO: MENÚ (desktop/tablet) */}
        <div className="nav-center">
          <ul className="menu-root" role="menubar" aria-label="Menú principal">
            {items.map((item, idx) => {
              const hasChildren =
                Array.isArray(item.children) && item.children.length > 0;
              const parentActive =
                isMatch(location.pathname, item.activeMatch || item.to) ||
                (hasChildren &&
                  item.children.some((c) =>
                    isMatch(location.pathname, c.activeMatch || c.to)
                  ));

              return (
                <li
                  key={item.label}
                  className={`menu-item ${openDropdown === idx ? "open" : ""}`}
                  onMouseEnter={() => {
                    if (window.innerWidth >= 768 && hasChildren)
                      setOpenDropdown(idx);
                  }}
                  onMouseLeave={() => {
                    if (window.innerWidth >= 768) setOpenDropdown(null);
                  }}
                >
                  <button
                    className={`menu-top ${parentActive ? "active" : ""}`}
                    aria-haspopup={hasChildren ? "true" : "false"}
                    aria-expanded={openDropdown === idx}
                    onClick={() => onTopItemClick(item, idx, hasChildren)}
                  >
                    {item.label}
                    {hasChildren && (
                      <span className="chev" aria-hidden>
                        ▾
                      </span>
                    )}
                  </button>

                  {hasChildren && (
                    <div
                      className="dropdown"
                      role="menu"
                      aria-label={`Submenú de ${item.label}`}
                    >
                      {item.children.map((child) => {
                        const childActive = isMatch(
                          location.pathname,
                          child.activeMatch || child.to
                        );
                        return (
                          <Link
                            key={child.to}
                            className={`dropdown-link ${
                              childActive ? "active" : ""
                            }`}
                            to={child.to}
                            onClick={() => setOpenDropdown(null)}
                            role="menuitem"
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* DERECHA */}
        <div className="nav-right">
          {user && (
            <Link
              to={goSupportPath}
              className={`nav-link support-link ${
                isSupportActive ? "active" : ""
              }`}
            >
              Soporte
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </Link>
          )}

          {user ? (
            <div className="user-box">
              <div className="user-avatar" aria-hidden>
                {user.name?.charAt(0)?.toUpperCase() ?? "U"}
              </div>
              <span className="nav-user">
                Hola, {capitalizeInitials(user.name)}
              </span>
              <button
                onClick={() => setShowConfirm(true)}
                className="logout-button"
              >
                Salir
              </button>
            </div>
          ) : (
            <div className="auth-links">
              <Link
                to="/login"
                className={
                  isMatch(location.pathname, /^\/login(\/|$)/)
                    ? "nav-link active"
                    : "nav-link"
                }
              >
                Login
              </Link>
              <Link
                to="/register"
                className={
                  isMatch(location.pathname, /^\/register(\/|$)/)
                    ? "nav-link active"
                    : "nav-link"
                }
              >
                Registro
              </Link>
            </div>
          )}

          {/* Hamburguesa (móvil) */}
          <button
            className={`burger ${drawerOpen ? "active" : ""}`}
            onClick={() => {
              setDrawerOpen((s) => !s);
              setMobileOpenIndex(null);
            }}
            aria-label="Abrir menú"
            aria-expanded={drawerOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        {/* Drawer móvil */}
        <aside
          className={`drawer ${drawerOpen ? "open" : ""}`}
          aria-hidden={!drawerOpen}
        >
          <div className="drawer-header">
            <span className="drawer-title">Menú</span>
            <button
              className="drawer-close"
              onClick={() => {
                setDrawerOpen(false);
                setMobileOpenIndex(null);
              }}
              aria-label="Cerrar menú"
            >
              ✕
            </button>
          </div>

          <div className="drawer-content">
            {items.map((item, idx) => {
              const hasChildren =
                Array.isArray(item.children) && item.children.length > 0;
              const isOpen = mobileOpenIndex === idx;
              const parentActive =
                isMatch(location.pathname, item.activeMatch || item.to) ||
                (hasChildren &&
                  item.children.some((c) =>
                    isMatch(location.pathname, c.activeMatch || c.to)
                  ));

              return (
                <div
                  key={item.label}
                  className={`drawer-item ${isOpen ? "open" : ""}`}
                >
                  <button
                    className={`drawer-parent ${parentActive ? "active" : ""}`}
                    onClick={() => onMobileParentClick(item, idx)}
                    aria-expanded={isOpen}
                    aria-haspopup={hasChildren ? "true" : "false"}
                  >
                    <span>{item.label}</span>
                    {hasChildren && (
                      <span className="chev" aria-hidden>
                        {isOpen ? "▴" : "▾"}
                      </span>
                    )}
                  </button>

                  {hasChildren && (
                    <div
                      className="drawer-children"
                      style={{ maxHeight: isOpen ? "480px" : "0" }}
                    >
                      {item.children.map((child) => {
                        const childActive = isMatch(
                          location.pathname,
                          child.activeMatch || child.to
                        );
                        return (
                          <Link
                            key={child.to}
                            to={child.to}
                            onClick={() => {
                              setDrawerOpen(false);
                              setMobileOpenIndex(null);
                            }}
                            className={`drawer-link ${
                              childActive ? "active" : ""
                            }`}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="drawer-sep" />
            {user ? (
              <>
                <Link
                  to={goSupportPath}
                  onClick={() => {
                    setDrawerOpen(false);
                    setMobileOpenIndex(null);
                  }}
                  className={`drawer-link support-mobile ${
                    isSupportActive ? "active" : ""
                  }`}
                >
                  Soporte
                  {unreadCount > 0 && (
                    <span className="badge-inline">{unreadCount}</span>
                  )}
                </Link>
                <button
                  className="drawer-logout"
                  onClick={() => {
                    setDrawerOpen(false);
                    setMobileOpenIndex(null);
                    setShowConfirm(true);
                  }}
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <div className="drawer-auth">
                <Link
                  to="/login"
                  onClick={() => {
                    setDrawerOpen(false);
                    setMobileOpenIndex(null);
                  }}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => {
                    setDrawerOpen(false);
                    setMobileOpenIndex(null);
                  }}
                >
                  Registro
                </Link>
              </div>
            )}
          </div>
        </aside>

        {/* Backdrop móvil */}
        {drawerOpen && (
          <div
            className="backdrop"
            onClick={() => {
              setDrawerOpen(false);
              setMobileOpenIndex(null);
            }}
            aria-hidden
          />
        )}
      </nav>

      {showConfirm && (
        <ConfirmModal
          title="Cerrar sesión"
          message="¿Deseas cerrar sesión?"
          onConfirm={() => {
            setShowConfirm(false);
            handleLogoutConfirm();
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
};

export default Navbar;
