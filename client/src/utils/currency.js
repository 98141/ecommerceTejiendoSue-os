export const formatCOP = (value) => {
  const num = Number(value ?? 0);
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0, // COP usualmente 0 decimales
    maximumFractionDigits: 0,
  }).format(num);
};
