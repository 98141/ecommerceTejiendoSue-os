import { useEffect, useState, useContext, useCallback } from "react";
import axios from "axios";
import { AuthContext } from "../../contexts/AuthContext";
import DashboardHeaderBlock from "../../blocks/admin/dashboar/DashboardHeaderBlock";
import MonthlySalesChart from "../../blocks/admin/dashboar/MonthlySalesChart";
import TopProductsChart from "../../blocks/admin/dashboar/TopProductsChart";
import OrdersByStatusChart from "../../blocks/admin/dashboar/OrdersByStatusChart";
import SummaryCardsBlock from "../../blocks/admin/dashboar/SummaryCardsBlock";
import DashboardFilters from "../../blocks/admin/dashboar/DashboardFilters";

const AdminDashboardPage = () => {
  const { token } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    category: "",
    groupByMonth: true,
  });

  const loadDashboard = useCallback(() => {
    axios
      .get("http://localhost:5000/api/dashboard/summary", {
        headers: { Authorization: `Bearer ${token}` },
        params: filters, // Pasar filtros al backend
      })
      .then((res) => setStats(res.data))
      .catch((err) => console.error("Error cargando dashboard:", err));
  }, [token, filters]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (!stats) return <p>Cargando métricas...</p>;

  return (
    <div className="dashboard-page" style={{ padding: "20px" }}>
      <DashboardHeaderBlock />
      <DashboardFilters onFilterChange={setFilters} />
      <SummaryCardsBlock summary={stats} />
      <MonthlySalesChart data={stats.monthlySales || []} />
      <TopProductsChart data={stats.topProducts || []} />
      <OrdersByStatusChart data={stats.ordersByStatus || []} />
    </div>
  );
};

export default AdminDashboardPage;
