import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const OrdersByStatusChart = ({ data }) => {
  return (
    <div className="chart-block">
      <h2>Pedidos por Estado</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="status" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#10b981" name="Pedidos" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OrdersByStatusChart;
