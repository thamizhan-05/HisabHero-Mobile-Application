import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownLeft, ArrowUpRight, TrendingUp, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchCashFlow } from "@/lib/api";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
} from "recharts";

const iconMap: Record<string, any> = {
  "Total Inflow": ArrowDownLeft,
  "Total Outflow": ArrowUpRight,
  "Net Cash Flow": DollarSign,
  "Avg Monthly Net": TrendingUp,
};

export default function CashFlow() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['cashflow'],
    queryFn: fetchCashFlow,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-8 animate-pulse text-muted-foreground p-8">
          Loading cash flow data...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-8 text-danger p-8">
          Failed to load cash flow data.
        </div>
      </DashboardLayout>
    );
  }

  const { monthlyData = [], stats = [] } = data;

  const cumulativeData = monthlyData.reduce<{ month: string; net: number }[]>((acc, d: any) => {
    const prev = acc.length ? acc[acc.length - 1].net : 0;
    acc.push({ month: d.month, net: prev + d.inflow - d.outflow });
    return acc;
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Cash Flow Analysis</h2>
          <p className="text-muted-foreground text-sm mt-1">Track your money in and out over time</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s: any) => {
            const IconComponent = iconMap[s.label] || DollarSign;
            return (
              <Card key={s.label} className="glass-card border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{s.label}</span>
                    <IconComponent className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                  <span className={`text-xs font-medium ${s.positive ? "text-primary" : "text-destructive"}`}>{s.trend} vs last quarter</span>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card border-border/50">
            <CardHeader><CardTitle className="text-base">Inflow vs Outflow</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
                  <XAxis dataKey="month" stroke="hsl(215 15% 55%)" fontSize={12} />
                  <YAxis stroke="hsl(215 15% 55%)" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip contentStyle={{ background: "hsl(220 18% 13%)", border: "1px solid hsl(220 14% 18%)", borderRadius: 8, color: "hsl(210 20% 92%)" }} />
                  <Legend />
                  <Bar dataKey="inflow" fill="hsl(160 84% 39%)" radius={[4, 4, 0, 0]} name="Inflow" />
                  <Bar dataKey="outflow" fill="hsl(0 84% 60%)" radius={[4, 4, 0, 0]} name="Outflow" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardHeader><CardTitle className="text-base">Cumulative Net Cash Flow</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={cumulativeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
                  <XAxis dataKey="month" stroke="hsl(215 15% 55%)" fontSize={12} />
                  <YAxis stroke="hsl(215 15% 55%)" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip contentStyle={{ background: "hsl(220 18% 13%)", border: "1px solid hsl(220 14% 18%)", borderRadius: 8, color: "hsl(210 20% 92%)" }} />
                  <Area type="monotone" dataKey="net" stroke="hsl(160 84% 39%)" fill="hsl(160 84% 39% / 0.15)" strokeWidth={2} name="Net Cash" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
