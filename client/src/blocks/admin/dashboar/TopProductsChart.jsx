import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
  "#a855f7",
  "#10b981",
  "#3b82f6",
  "#f97316",
];

const TopProductsChart = ({ data, currency = "USD" }) => {
  const fmtMoney = (v) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency }).format(
      Number(v || 0)
    );

  const pieData = (data || []).map((d) => ({
    name: d.name,
    quantity: d.quantity,
    revenue: d.revenue,
    value: d.quantity, // se grafica por unidades
  }));

  return (
    <div className="chart-block">
      <h2>Productos Más Vendidos (unidades)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            dataKey="value"
            data={pieData}
            cx="50%"
            cy="50%"
            outerRadius={110}
            label={({ name, value }) => `${name} (${value})`}
          >
            {pieData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v, n, ctx) => {
              const d = ctx?.payload;
              return [`${v} uds · ${fmtMoney(d?.revenue || 0)}`, "Detalle"];
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TopProductsChart;
