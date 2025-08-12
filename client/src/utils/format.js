export const formatCOP = (value, currency = "COP") => {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency
    }).format(value ?? 0);
  } catch {
    return `$${value}`;
  }
};
