import { useEffect, useRef, useState } from "react";

export default function CheckoutModal({ open, onClose, onConfirm }) {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const cardRef = useRef(null);
  const firstInputRef = useRef(null);

  // cerrar con ESC + bloquear scroll del body
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  // autofocus primer input
  useEffect(() => {
    if (open && firstInputRef.current) firstInputRef.current.focus();
  }, [open]);

  if (!open) return null;

  const handleBackdropClick = (e) => {
    // Cierra solo si el clic fue fuera de la tarjeta
    if (cardRef.current && !cardRef.current.contains(e.target)) onClose?.();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: "" }));
  };

  const validate = () => {
    const er = {};
    if (!form.fullName.trim()) er.fullName = "Ingresa tu nombre completo.";
    if (!form.phone.trim()) er.phone = "Ingresa un número de contacto.";
    else if (!/^\+?\d{8,15}$/.test(form.phone.trim()))
      er.phone = "Usa sólo números (8-15 dígitos).";
    if (!form.address.trim()) er.address = "Ingresa tu dirección.";
    if (!form.city.trim()) er.city = "Ingresa tu ciudad.";
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const maybe = onConfirm?.(form);
    // Si onConfirm devuelve una Promesa, mostramos "Cargando..."
    if (maybe && typeof maybe.then === "function") {
      try {
        setSubmitting(true);
        await maybe;
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div
      className="cm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cm-title"
      onMouseDown={handleBackdropClick}
    >
      <div
        className="cm__card"
        ref={cardRef}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button className="cm__close" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>

        <h3 id="cm-title" className="cm__title">
          Datos de envío
        </h3>

        <form className="cm__form" onSubmit={handleSubmit} noValidate>
          <div className="cm__grid">
            <div className="cm__field">
              <label htmlFor="fullName">Nombre completo *</label>
              <input
                ref={firstInputRef}
                id="fullName"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Ej. Ana Pérez"
                autoComplete="name"
              />
              {errors.fullName && (
                <span className="cm__error">{errors.fullName}</span>
              )}
            </div>

            <div className="cm__field">
              <label htmlFor="phone">Teléfono / WhatsApp *</label>
              <input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                inputMode="tel"
                placeholder="Ej. 3001234567"
                autoComplete="tel"
              />
              {errors.phone && (
                <span className="cm__error">{errors.phone}</span>
              )}
            </div>

            <div className="cm__field cm__field--full">
              <label htmlFor="address">Dirección *</label>
              <input
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Calle 12 #34-56, Apto 201"
                autoComplete="street-address"
              />
              {errors.address && (
                <span className="cm__error">{errors.address}</span>
              )}
            </div>

            <div className="cm__field">
              <label htmlFor="city">Ciudad *</label>
              <input
                id="city"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Ej. Pasto"
                autoComplete="address-level2"
              />
              {errors.city && <span className="cm__error">{errors.city}</span>}
            </div>

            <div className="cm__field">
              <label htmlFor="notes">Notas (opcional)</label>
              <textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Referencias de entrega, horarios, piso, etc."
                rows={3}
              />
            </div>
          </div>

          <div className="cm__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={submitting}
            >
              {submitting ? "Confirmando..." : "Confirmar pedido"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
