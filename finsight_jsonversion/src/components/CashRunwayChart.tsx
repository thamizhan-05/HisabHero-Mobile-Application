import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { fetchRunway } from "@/lib/api";

export function CashRunwayChart() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['runway'],
    queryFn: fetchRunway,
  });

  if (isLoading) return <div className="glass-card rounded-2xl p-6 h-[400px] animate-pulse">Loading runway...</div>;
  if (error || !data) return <div className="glass-card rounded-2xl p-6 text-danger">Failed to load runway data.</div>;

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
        Cash Runway
      </h3>
      <p className="text-xs text-muted-foreground mb-6">Months of cash remaining (projected*)</p>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="runwayGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(160 84% 39%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(160 84% 39%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
          <XAxis dataKey="month" tick={{ fill: "hsl(215 15% 55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "hsl(215 15% 55%)", fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 18]} />
          <Tooltip
            contentStyle={{
              background: "hsl(220 18% 13%)",
              border: "1px solid hsl(220 14% 22%)",
              borderRadius: "12px",
              color: "hsl(210 20% 92%)",
            }}
            formatter={(value: number) => [`${value} months`, "Runway"]}
          />
          <Area
            type="monotone"
            dataKey="runway"
            stroke="hsl(160 84% 39%)"
            strokeWidth={2.5}
            fill="url(#runwayGrad)"
            dot={{ r: 4, fill: "hsl(160 84% 39%)", stroke: "hsl(220 18% 13%)", strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
