import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { formatCOP } from "../../../utils/currency"; 

function alignSeries(current = [], previous = []) {
  const mapCurr = new Map(current.map((d) => [d.period, d.total]));
  const mapPrev = new Map(previous.map((d) => [d.period, d.total]));
  const keys = new Set([...mapCurr.keys(), ...mapPrev.keys()]);
  const arr = [...keys].sort().map((k) => ({
    period: k,
    current: Number(mapCurr.get(k) || 0),
    previous: Number(mapPrev.get(k) || 0),
  }));
  return arr;
}

const MonthlySalesChart = ({ current, previous, groupByMonth }) => {
  const data = alignSeries(current, previous);
  const label = groupByMonth ? "Ventas por mes" : "Ventas por día";

  return (
    <div className="chart-block">
      <h2>{label}</h2>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          {/* ✅ Mostrar en pesos colombianos */}
          <YAxis tickFormatter={(v) => formatCOP(v)} width={120} />
          <Tooltip
            formatter={(v) => formatCOP(v)}
            labelFormatter={(l) => `Período: ${l}`}
          />
          <Legend />
          <Bar dataKey="current" name="Actual" fill="#3b82f6" />
          <Bar dataKey="previous" name="Anterior" fill="#94a3b8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlySalesChart;
