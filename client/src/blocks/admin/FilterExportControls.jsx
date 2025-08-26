const FilterExportControls = ({
  statusFilter,
  setStatusFilter,
  searchFilter,
  setSearchFilter,
  dateRange,
  setDateRange,
  exportToPDF,
  exportToExcel,
  dateError,
  hasResults,
}) => {
  const handleClearFilters = () => {
    setStatusFilter("todos");
    setSearchFilter("");
    setDateRange({ from: "", to: "" });
  };

  // evita submit
  const handleKeyDown = (e) => {
    if (e.key === "Enter") e.preventDefault(); 
  };

  const exportDisabled = !!dateError || !hasResults;
  const tooltipMessage = dateError
    ? dateError
    : !hasResults
    ? "No hay pedidos que coincidan con los filtros"
    : "";

  return (
    <section
      className="af"
      onKeyDown={handleKeyDown}
      aria-label="Controles de filtro y exportación"
    >
      <div className="af__group">
        <label className="af__label">Estado</label>
        <select
          className="af__select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="todos">Todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="facturado">Facturado</option>
          <option value="enviado">Enviado</option>
          <option value="entregado">Entregado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      <div className="af__group af__group--grow">
        <label className="af__label">Buscar</label>
        <input
          className="af__input"
          type="text"
          placeholder="Correo, nombre o ID"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
        />
      </div>

      <div className="af__group">
        <label className="af__label">Desde</label>
        <input
          className="af__input"
          type="date"
          value={dateRange.from}
          onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
        />
      </div>

      <div className="af__group">
        <label className="af__label">Hasta</label>
        <input
          className="af__input"
          type="date"
          value={dateRange.to}
          onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
        />
      </div>

      <div className="af__sep" />

      <div className="af__actions" title={exportDisabled ? tooltipMessage : ""}>
        <button className="btn btn--ghost" onClick={handleClearFilters}>
          Limpiar
        </button>
        <button
          className="btn btn--primary"
          onClick={exportToPDF}
          disabled={exportDisabled}
        >
          {exportDisabled ? "PDF (bloqueado)" : "Exportar PDF"}
        </button>
        <button
          className="btn btn--dark"
          onClick={exportToExcel}
          disabled={exportDisabled}
        >
          {exportDisabled ? "Excel (bloqueado)" : "Exportar Excel"}
        </button>
      </div>
    </section>
  );
};

export default FilterExportControls;
