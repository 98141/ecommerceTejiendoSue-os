import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { CartContext } from "../contexts/CartContext";
import { SupportContext } from "../contexts/SupportContext";
import { useToast } from "../contexts/ToastContext";
import ConfirmModal from "../blocks/ConfirmModalBlock";

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
const menuConfig = ({ role, hidePublic }) => {
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
          { label: "Pedidos", to: "/admin", activeMatch: /^\/admin\/?$/ },
          {
            label: "Historial",
            to: "/admin/orders",
            activeMatch: /^\/admin\/orders(\/|$)/,
          },
          {
            label: "Productos",
            to: "/admin/products",
            activeMatch: /^\/admin\/products(\/|$)/,
            children: [
              {
                label: "Ver productos",
                to: "/admin/products",
                activeMatch: /^\/admin\/products(\/|$)/,
              },
              {
                label: "Agregar producto",
                to: "/admin/products/new",
                activeMatch: /^\/admin\/products\/new(\/|$)/,
              },
              {
                label: "Categorias",
                to: "/admin/categories",
                activeMatch: /^\/admin\/categories(\/|$)/,
              },
              {
                label: "Tallas",
                to: "/admin/sizes",
                activeMatch: /^\/admin\/sizes(\/|$)/,
              },
              {
                label: "Colores",
                to: "/admin/colors",
                activeMatch: /^\/admin\/colors(\/|$)/,
              },
              {
                label: "Historial",
                to: "/admin/historial",
                activeMatch: /^\/admin\/history(\/|$)/,
              },
            ],
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
  const [openDropdown, setOpenDropdown] = useState(null); // desktop
  const [drawerOpen, setDrawerOpen] = useState(false); // mobile
  const [mobileOpenIndex, setMobileOpenIndex] = useState(null); // accordion (si lo necesitas)
  const [showSearch, setShowSearch] = useState(false); // search desktop

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const navRef = useRef(null);

  const isAdminRoute = location.pathname.startsWith("/admin");
  const hidePublic = isAdminRoute || Boolean(user);

  const capitalizeInitials = (name) =>
    (name || "")
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

  // Cierra dropdowns/drawer con click fuera y Esc
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
        setShowSearch(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const items = menuConfig({ role: user?.role, hidePublic });

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

  // Íconos
  const handleSearchToggle = () => setShowSearch((s) => !s);
  const handleWishlist = () =>
    showToast("Favoritos estará disponible pronto.", "info");
  const handleAccountClick = () => {
    if (!user) navigate("/login");
    else navigate(user.role === "admin" ? "/admin/dashboard" : "/");
  };

  return (
    <>
      <nav className="navbar-container" ref={navRef}>
        <div className="navbar-wrapper">
          {/* IZQUIERDA: LOGO */}
          <div className="nav-left">
            <Link
              to={
                user ? (user.role === "admin" ? "/admin/dashboard" : "/") : "/"
              }
              className="brand"
            >
              <span className="brand-name">Artesanías Paja Toquilla</span>
            </Link>
          </div>

          {/* CENTRO: MENÚ (solo desktop/tablet) */}
          <div className="nav-center">
            <ul
              className="menu-root"
              role="menubar"
              aria-label="Menú principal"
            >
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
                    className={`menu-item ${
                      openDropdown === idx ? "open" : ""
                    }`}
                    // 👇 eliminamos el auto-close en mouseleave
                    onMouseEnter={() => {
                      if (window.innerWidth >= 1024 && hasChildren)
                        setOpenDropdown(idx);
                    }}
                  >
                    <button
                      className={`menu-top ${parentActive ? "active" : ""}`}
                      aria-haspopup={hasChildren ? "true" : "false"}
                      aria-expanded={openDropdown === idx}
                      onClick={(e) => {
                        e.preventDefault();
                        if (!hasChildren) {
                          navigate(item.to);
                          return;
                        }
                        // toggle con clic
                        setOpenDropdown((cur) => (cur === idx ? null : idx));
                      }}
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
                        aria-hidden={openDropdown !== idx}
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
                              onClick={() => setOpenDropdown(null)} // cierra solo al dar click
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
            {/* Iconos (solo desktop) */}
            <div className="icon-bar">
              <button
                className={`icon-btn ${showSearch ? "active" : ""}`}
                onClick={handleSearchToggle}
                aria-label="Buscar"
                title="Buscar"
                type="button"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15.5 14h-.79l-.28-.27A6.5 6.5 0 1 0 14 15.5l.27.28v.79L20 21l1-1-5.5-5.5zM5 10.5A5.5 5.5 0 1 1 10.5 16 5.51 5.51 0 0 1 5 10.5z" />
                </svg>
              </button>

              <button
                className="icon-btn"
                onClick={handleWishlist}
                aria-label="Favoritos"
                title="Favoritos"
                type="button"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 21s-6.716-4.35-9.33-7.12C.5 11.6 1.09 8.16 3.64 6.84A4.86 4.86 0 0 1 12 8.17a4.86 4.86 0 0 1 8.36-1.33c2.55 1.32 3.14 4.76.97 7.04C18.716 16.65 12 21 12 21z" />
                </svg>
              </button>

              <Link
                to="/cart"
                className="icon-btn cart-btn"
                aria-label="Carrito"
                title="Carrito"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M7 4h-2l-1 2v2h2l3.6 7.59L8.24 18H19v-2H9.42l1.1-2h6.45a2 2 0 0 0 1.79-1.11L21 7H6.21l-.94-2H3" />
                </svg>
                {totalItems > 0 && (
                  <span className="cart-badge">{totalItems}</span>
                )}
              </Link>
            </div>

            {/* Perfil (siempre visible; en mobile queda solo este + burger) */}
            <button
              className="account-btn"
              onClick={handleAccountClick}
              aria-label="Cuenta"
              title="Cuenta"
              type="button"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z" />
              </svg>
            </button>

            {/* Soporte + usuario (solo desktop) */}
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
                  type="button"
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
                setShowSearch(false);
              }}
              aria-label="Abrir menú"
              aria-expanded={drawerOpen}
              type="button"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        {/* Búsqueda desplegable (desktop/tablet) */}
        <div
          className={`search-bar ${showSearch ? "open" : ""}`}
          role="region"
          aria-hidden={!showSearch}
        >
          <form
            className="search-form"
            onSubmit={(e) => {
              e.preventDefault();
              const q = e.currentTarget.elements.q.value.trim();
              if (!q) return;
              showToast(`Buscando: ${q}`, "info");
            }}
          >
            <input
              name="q"
              type="search"
              placeholder="Busca productos, colecciones…"
              aria-label="Buscar"
            />
            <button type="submit" className="btn-search">
              Buscar
            </button>
          </form>
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
              type="button"
            >
              ✕
            </button>
          </div>

          {/* Barra de iconos dentro del drawer (buscador, favoritos, carrito) */}
          <div className="drawer-icons">
            <button
              className="icon-btn"
              onClick={handleSearchToggle}
              aria-label="Buscar"
            >
              <svg viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27A6.5 6.5 0 1 0 14 15.5l.27.28v.79L20 21l1-1-5.5-5.5zM5 10.5A5.5 5.5 0 1 1 10.5 16 5.51 5.51 0 0 1 5 10.5z" />
              </svg>
            </button>
            <button
              className="icon-btn"
              onClick={handleWishlist}
              aria-label="Favoritos"
            >
              <svg viewBox="0 0 24 24">
                <path d="M12 21s-6.716-4.35-9.33-7.12C.5 11.6 1.09 8.16 3.64 6.84A4.86 4.86 0 0 1 12 8.17a4.86 4.86 0 0 1 8.36-1.33c2.55 1.32 3.14 4.76.97 7.04C18.716 16.65 12 21 12 21z" />
              </svg>
            </button>
            <Link
              to="/cart"
              className="icon-btn cart-btn"
              aria-label="Carrito"
              onClick={() => setDrawerOpen(false)}
            >
              <svg viewBox="0 0 24 24">
                <path d="M7 4h-2l-1 2v2h2l3.6 7.59L8.24 18H19v-2H9.42l1.1-2h6.45a2 2 0 0 0 1.79-1.11L21 7H6.21l-.94-2H3" />
              </svg>
              {totalItems > 0 && (
                <span className="cart-badge">{totalItems}</span>
              )}
            </Link>
          </div>

          {/* Buscador compacto dentro del drawer */}
          <div className="drawer-search">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const q = e.currentTarget.elements.qm.value.trim();
                if (!q) return;
                setDrawerOpen(false);
                showToast(`Buscando: ${q}`, "info");
                // Si tienes ruta de búsqueda, podrías:
                // navigate(`/buscar?q=${encodeURIComponent(q)}`);
              }}
            >
              <input
                name="qm"
                type="search"
                placeholder="Buscar…"
                aria-label="Buscar en móvil"
              />
              <button type="submit">Ir</button>
            </form>
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
                    onClick={() => {
                      if (!hasChildren) {
                        setDrawerOpen(false);
                        navigate(item.to);
                      } else {
                        setMobileOpenIndex((cur) => (cur === idx ? null : idx));
                      }
                    }}
                    aria-expanded={isOpen}
                    aria-haspopup={hasChildren ? "true" : "false"}
                    type="button"
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

            {user && (
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
            )}

            {/* 👇 En móvil NO mostramos login/registro, tal como pediste */}
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
