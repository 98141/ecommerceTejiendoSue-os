import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const MonthlySalesChart = ({ data, currency = "USD" }) => {
  const fmtMoney = (v) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency }).format(
      Number(v || 0)
    );

  return (
    <div className="chart-block">
      <h2>Ventas por período</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis tickFormatter={(v) => fmtMoney(v)} width={100} />
          <Tooltip
            formatter={(v) => fmtMoney(v)}
            labelFormatter={(l) => `Período: ${l}`}
          />
          <Bar dataKey="total" fill="#3b82f6" name="Ventas" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlySalesChart;
