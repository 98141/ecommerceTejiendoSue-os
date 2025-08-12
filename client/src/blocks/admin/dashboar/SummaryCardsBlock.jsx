const nf = (n) => Number(n || 0).toLocaleString("es-CO");
const money = (n, currency = "USD") =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency }).format(
    Number(n || 0)
  );

const SummaryCardsBlock = ({ summary = {} }) => {
  const currency = summary.currency || "USD";
  return (
    <div
      className="summary-cards"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, minmax(0,1fr))",
        gap: 12,
        marginBottom: 16,
      }}
    >
      <div className="card-summary">
        <h3>Ventas Totales</h3>
        <p>{money(summary.totalSales, currency)}</p>
      </div>
      <div className="card-summary">
        <h3>Pedidos Totales</h3>
        <p>{nf(summary.totalOrders)}</p>
      </div>
      <div className="card-summary">
        <h3>Productos Vendidos</h3>
        <p>{nf(summary.totalItemsSold)}</p>
      </div>
      <div className="card-summary">
        <h3>Clientes (rango)</h3>
        <p>{nf(summary.totalUsers)}</p>
      </div>
      <div className="card-summary">
        <h3>AOV</h3>
        <p>{money(summary.aov, currency)} / pedido</p>
      </div>
      {/* Extra opcional: Items por pedido */}
      {/* <div className="card-summary"><h3>Items por Pedido</h3><p>{nf(summary.itemsPerOrder)}</p></div> */}
    </div>
  );
};
export default SummaryCardsBlock;
