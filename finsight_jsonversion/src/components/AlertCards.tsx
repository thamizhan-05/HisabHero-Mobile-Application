import { AlertTriangle, TrendingDown, Lightbulb } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchAlerts } from "@/lib/api";

const iconMap: Record<string, any> = {
  AlertTriangle,
  TrendingDown,
  Lightbulb,
};

export function AlertCards() {
  const { data: alerts, isLoading, error } = useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
  });

  if (isLoading) return <div className="space-y-6 animate-pulse"><div className="h-6 w-1/3 bg-muted rounded"></div><div className="grid grid-cols-1 lg:grid-cols-3 gap-4"><div className="h-24 bg-muted/20 rounded-2xl"></div><div className="h-24 bg-muted/20 rounded-2xl"></div><div className="h-24 bg-muted/20 rounded-2xl"></div></div></div>;
  if (error || !alerts) return <div className="text-danger">Failed to load alerts</div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          Actionable Insights & Anomaly Detection
        </h3>
        <p className="text-xs text-muted-foreground">AI-powered analysis of your financial data</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {alerts.map((alert: any) => {
          const IconComponent = iconMap[alert.icon] || Lightbulb;
          return (
            <div
              key={alert.type}
              className={`rounded-2xl border p-5 transition-all duration-300 hover:scale-[1.02] ${alert.colorClass}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{alert.emoji}</span>
                <IconComponent className={`w-4 h-4 ${alert.iconColor}`} />
                <span className="text-sm font-semibold text-foreground">{alert.title}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{alert.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
