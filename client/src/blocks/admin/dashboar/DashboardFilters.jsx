import { useState, useEffect } from "react";
import axios from "axios";

const DashboardFilters = ({ onFilterChange }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [groupByMonth, setGroupByMonth] = useState(true);

  // Cargar categorías desde el backend
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/categories")
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Error cargando categorías:", err));
  }, []);

  // Llamar a la función de cambio cuando cambien los filtros
  useEffect(() => {
    onFilterChange({
      startDate,
      endDate,
      category: selectedCategory,
      groupByMonth,
    });
  }, [startDate, endDate, selectedCategory, groupByMonth, onFilterChange]);

  return (
    <div className="dashboard-filters" style={{ marginBottom: "20px", display: "flex", gap: "20px" }}>
      <div>
        <label>Fecha inicio:</label>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </div>
      <div>
        <label>Fecha fin:</label>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>
      <div>
        <label>Categoría:</label>
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          <option value="">Todas</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            checked={groupByMonth}
            onChange={(e) => setGroupByMonth(e.target.checked)}
          />
          Agrupar por mes
        </label>
      </div>
    </div>
  );
};

export default DashboardFilters;
