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

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  const exportDisabled = !!dateError || !hasResults;

  const tooltipMessage = dateError
    ? dateError
    : !hasResults
    ? "No hay pedidos que coincidan con los filtros"
    : "";

  return (
    <div
      style={{
        marginBottom: "20px",
        display: "flex",
        gap: "1rem",
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <label>Estado:</label>
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <option value="todos">Todos</option>
        <option value="pendiente">Pendiente</option>
        <option value="enviado">Enviado</option>
        <option value="entregado">Entregado</option>
      </select>

      <label>Buscar:</label>
      <input
        type="text"
        placeholder="Correo, nombre o ID"
        value={searchFilter}
        onChange={(e) => setSearchFilter(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <label>Desde:</label>
      <input
        type="date"
        value={dateRange.from}
        onChange={(e) =>
          setDateRange({ ...dateRange, from: e.target.value })
        }
      />

      <label>Hasta:</label>
      <input
        type="date"
        value={dateRange.to}
        onChange={(e) =>
          setDateRange({ ...dateRange, to: e.target.value })
        }
      />

      {/* Botón Exportar PDF */}
      <div title={exportDisabled ? tooltipMessage : ""}>
        <button
          className="export-button"
          onClick={exportToPDF}
          disabled={exportDisabled}
        >
          {exportDisabled && <span className="warning-icon">⚠️</span>}
          Exportar PDF
        </button>
      </div>

      {/* Botón Exportar Excel */}
      <div title={exportDisabled ? tooltipMessage : ""}>
        <button
          className="export-button"
          onClick={exportToExcel}
          disabled={exportDisabled}
        >
          {exportDisabled && <span className="warning-icon">⚠️</span>}
          Exportar Excel
        </button>
      </div>

      <button onClick={handleClearFilters}>Limpiar filtros</button>
    </div>
  );
};

export default FilterExportControls;