import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { fetchRevenueExpense } from "@/lib/api";

const fmt = (v: number) => `₹${(v / 1000).toFixed(0)}K`;

export function RevenueExpenseChart() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['revenue-expense'],
    queryFn: fetchRevenueExpense,
  });

  if (isLoading) return <div className="glass-card rounded-2xl p-6 h-[400px] animate-pulse">Loading chart...</div>;
  if (error || !data) return <div className="glass-card rounded-2xl p-6 text-danger">Failed to load chart data.</div>;

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
        Monthly Revenue vs Expenses
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
          <XAxis dataKey="month" tick={{ fill: "hsl(215 15% 55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmt} tick={{ fill: "hsl(215 15% 55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: "hsl(220 18% 13%)",
              border: "1px solid hsl(220 14% 22%)",
              borderRadius: "12px",
              color: "hsl(210 20% 92%)",
            }}
            formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, ""]}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "hsl(215 15% 55%)" }} />
          <Bar dataKey="revenue" name="Revenue" fill="hsl(160 84% 39%)" radius={[6, 6, 0, 0]} />
          <Bar dataKey="expenses" name="Expenses" fill="hsl(0 84% 60%)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
