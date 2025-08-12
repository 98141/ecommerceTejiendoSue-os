const nf = (n) => Number(n || 0).toLocaleString("es-CO");
const money = (n, currency = "USD") =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency }).format(
    Number(n || 0)
  );

function Delta({ pct }) {
  const v = Number(pct || 0);
  const up = v >= 0;
  const color = up ? "#16a34a" : "#dc2626";
  const sign = up ? "▲" : "▼";
  const label = `${sign} ${Math.abs(v).toFixed(2)}%`;
  return <span style={{ color, fontWeight: 600, marginLeft: 8 }}>{label}</span>;
}

const SummaryCardsBlock = ({ summary = {} }) => {
  const currency = summary.currency || "USD";
  const change = summary.change || {};
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
        <p>
          {money(summary.totalSales, currency)}{" "}
          <Delta pct={change.totalSalesPct} />
        </p>
      </div>
      <div className="card-summary">
        <h3>Pedidos Totales</h3>
        <p>
          {nf(summary.totalOrders)} <Delta pct={change.totalOrdersPct} />
        </p>
      </div>
      <div className="card-summary">
        <h3>Productos Vendidos</h3>
        <p>
          {nf(summary.totalItemsSold)} <Delta pct={change.totalItemsSoldPct} />
        </p>
      </div>
      <div className="card-summary">
        <h3>Clientes (rango)</h3>
        <p>{nf(summary.totalUsers)}</p>
      </div>
      <div className="card-summary">
        <h3>AOV</h3>
        <p>
          {money(summary.aov, currency)} <Delta pct={change.aovPct} />
        </p>
      </div>
      {/* Si quieres mostrar items por pedido:
      <div className="card-summary">
        <h3>Items por Pedido</h3>
        <p>{Number(summary.itemsPerOrder || 0).toFixed(2)} <Delta pct={change.itemsPerOrderPct} /></p>
      </div> */}
    </div>
  );
};
export default SummaryCardsBlock;
