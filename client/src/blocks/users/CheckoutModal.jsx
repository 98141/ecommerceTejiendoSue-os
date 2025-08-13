import { useState } from "react";

export default function CheckoutModal({ open, onClose, onConfirm }) {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    notes: "",
  });

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validaciones mínimas
    if (!form.fullName || !form.phone || !form.address || !form.city) {
      alert("Por favor, completa los campos obligatorios.");
      return;
    }
    onConfirm(form);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3>Datos de envío</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>Nombre completo *</label>
          <input name="fullName" value={form.fullName} onChange={handleChange} />

          <label>Teléfono / WhatsApp *</label>
          <input name="phone" value={form.phone} onChange={handleChange} />

          <label>Dirección *</label>
          <input name="address" value={form.address} onChange={handleChange} />

          <label>Ciudad *</label>
          <input name="city" value={form.city} onChange={handleChange} />

          <label>Notas (opcional)</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} />

          <div className="modal-actions">
            <button type="button" onClick={onClose}>Cancelar</button>
            <button type="submit">Confirmar pedido</button>
          </div>
        </form>
      </div>
    </div>
  );
}
