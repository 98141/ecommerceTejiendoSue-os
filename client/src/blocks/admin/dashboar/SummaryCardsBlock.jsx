const SummaryCardsBlock = ({ summary = {} }) => {
  return (
    <div className="summary-cards">
      <div className="card-summary">
        <h3>Ventas Totales</h3>
        <p>${(summary.totalSales || 0).toFixed(2)}</p>
      </div>
      <div className="card-summary">
        <h3>Pedidos Totales</h3>
        <p>{summary.totalOrders || 0}</p>
      </div>
      <div className="card-summary">
        <h3>Productos Vendidos</h3>
        <p>{summary.totalItemsSold || 0}</p>
      </div>
      <div className="card-summary">
        <h3>Clientes</h3>
        <p>{summary.totalUsers || 0}</p>
      </div>
    </div>
  );
};

export default SummaryCardsBlock;
