import { useEffect, useState, useContext, useCallback } from "react";
import axios from "axios";
import { AuthContext } from "../../contexts/AuthContext";
import DashboardHeaderBlock from "../../blocks/admin/dashboar/DashboardHeaderBlock";
import MonthlySalesChart from "../../blocks/admin/dashboar/MonthlySalesChart";
import TopProductsChart from "../../blocks/admin/dashboar/TopProductsChart";
import OrdersByStatusChart from "../../blocks/admin/dashboar/OrdersByStatusChart";
import SummaryCardsBlock from "../../blocks/admin/dashboar/SummaryCardsBlock";
import DashboardFilters from "../../blocks/admin/dashboar/DashboardFilters";

const API = "http://localhost:5000/api";

const AdminDashboardPage = () => {
  const { token } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    category: "",
    groupByMonth: true,
  });

  const loadDashboard = useCallback(() => {
    setLoading(true);
    setErr(null);
    axios
      .get(`${API}/dashboard/summary`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters,
      })
      .then((res) => setStats(res.data))
      .catch((e) => {
        console.error("Error cargando dashboard:", e);
        setErr("No se pudo cargar el dashboard");
      })
      .finally(() => setLoading(false));
  }, [token, filters]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading && !stats) return <p>Cargando métricas...</p>;
  if (err) return <p style={{ color: "crimson" }}>{err}</p>;
  if (!stats) return null;

  return (
    <div className="dashboard-page" style={{ padding: "20px" }}>
      <DashboardHeaderBlock />
      <DashboardFilters onFilterChange={setFilters} />
      <SummaryCardsBlock summary={stats} />
      <MonthlySalesChart data={stats.monthlySales || []} currency={stats.currency || "USD"} />
      <TopProductsChart data={stats.topProducts || []} currency={stats.currency || "USD"} />
      <OrdersByStatusChart data={stats.ordersByStatus || []} />
    </div>
  );
};

export default AdminDashboardPage;
