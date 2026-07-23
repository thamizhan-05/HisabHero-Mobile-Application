import { IndianRupee, TrendingUp, TrendingDown, Percent } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchStats } from "@/lib/api";

const iconMap = {
  TrendingUp,
  TrendingDown,
  Percent,
  IndianRupee,
};

export function QuickStats() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['quickStats'],
    queryFn: fetchStats,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card-hover rounded-2xl p-5 h-[104px] animate-pulse bg-muted/20" />
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return <div className="text-danger text-sm">Failed to load stats.</div>;
  }

  if (stats.length === 0) {
    return (
      <div className="glass-card-hover rounded-2xl p-8 text-center text-muted-foreground text-sm">
        <p className="text-3xl mb-2">📤</p>
        <p className="font-medium">No data yet</p>
        <p className="text-xs mt-1">Upload a CSV file using the button above to see your metrics.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {stats.map((stat: any) => {
        const Icon = iconMap[stat.icon as keyof typeof iconMap] || IndianRupee;
        return (
          <div
            key={stat.label}
            className={`glass-card-hover rounded-2xl p-5 ${stat.glow}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                stat.positive ? "bg-success/10" : "bg-danger/10"
              }`}>
                <Icon className={`w-4 h-4 ${stat.positive ? "text-success" : "text-danger"}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground font-mono">{stat.value}</p>
            <p className={`text-xs font-medium mt-1 ${stat.positive ? "text-success" : "text-danger"}`}>
              {stat.change} vs last month
            </p>
          </div>
        );
      })}
    </div>
  );
}
