import { useState, useEffect } from "react";

import apiUrl from "../../../api/apiClient";

function fmt(date) {
  return date.toISOString().slice(0, 10);
}
function todayStr() {
  const d = new Date();
  return fmt(d);
}
function addDays(base, days) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

const DashboardFilters = ({ onFilterChange }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [groupByMonth, setGroupByMonth] = useState(true);

 

  useEffect(() => {
    apiUrl
      .get("categories")
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Error cargando categorías:", err));
  }, []);

  // Aplica cuando el usuario suelta cambios
  useEffect(() => {
    onFilterChange({
      startDate,
      endDate,
      category: selectedCategory,
      groupByMonth,
    });
  }, [startDate, endDate, selectedCategory, groupByMonth, onFilterChange]);

  const setRange = (type) => {
    const today = new Date();
    if (type === "today") {
      const t = todayStr();
      setStartDate(t);
      setEndDate(t);
      return;
    }
    if (type === "7d") {
      setEndDate(todayStr());
      setStartDate(fmt(addDays(today, -6)));
      return;
    }
    if (type === "month") {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(fmt(first));
      setEndDate(todayStr());
      return;
    }
    if (type === "year") {
      const first = new Date(today.getFullYear(), 0, 1);
      setStartDate(fmt(first));
      setEndDate(todayStr());
      return;
    }
    if (type === "clear") {
      setStartDate("");
      setEndDate("");
      return;
    }
  };

  return (
    <div
      className="dashboard-filters"
      style={{ marginBottom: 20, display: "flex", gap: 16, flexWrap: "wrap" }}
    >
      <div>
        <label>Fecha inicio:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>
      <div>
        <label>Fecha fin:</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>
      <div>
        <label>Categoría:</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">Todas</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
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
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn" onClick={() => setRange("today")}>
          Hoy
        </button>
        <button className="btn" onClick={() => setRange("7d")}>
          7 días
        </button>
        <button className="btn" onClick={() => setRange("month")}>
          Mes actual
        </button>
        <button className="btn" onClick={() => setRange("year")}>
          Año actual
        </button>
        <button className="btn" onClick={() => setRange("clear")}>
          Limpiar
        </button>
      </div>
    </div>
  );
};

export default DashboardFilters;
