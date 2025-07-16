import dayjs from "dayjs";

const FilterExportControls = ({
  statusFilter,
  setStatusFilter,
  emailFilter,
  setEmailFilter,
  dateRange,
  setDateRange,
  exportToPDF,
  exportToExcel
}) => {
  return (
    <div style={{
      marginBottom: "20px",
      display: "flex",
      gap: "1rem",
      flexWrap: "wrap",
      alignItems: "center"
    }}>
      <label>Estado:</label>
      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
        <option value="todos">Todos</option>
        <option value="pendiente">Pendiente</option>
        <option value="enviado">Enviado</option>
        <option value="entregado">Entregado</option>
      </select>

      <label>Correo:</label>
      <input
        type="text"
        placeholder="Buscar por correo"
        value={emailFilter}
        onChange={(e) => setEmailFilter(e.target.value)}
      />

      <label>Desde:</label>
      <input
        type="date"
        value={dateRange.from}
        onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
      />

      <label>Hasta:</label>
      <input
        type="date"
        value={dateRange.to}
        onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
      />

      <button onClick={exportToPDF}>Exportar PDF</button>
      <button onClick={exportToExcel}>Exportar Excel</button>
    </div>
  );
};

export default FilterExportControls;
