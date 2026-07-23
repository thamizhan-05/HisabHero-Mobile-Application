import { useQuery } from "@tanstack/react-query";
import { fetchHealth } from "@/lib/api";

export function HealthScoreGauge() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  });

  if (isLoading) return <div className="glass-card rounded-2xl p-8 flex flex-col items-center justify-center h-[340px] animate-pulse">Loading...</div>;
  if (error || !data) return <div className="glass-card rounded-2xl p-8 text-danger">Failed to load health score.</div>;

  const score = data.score || 0;
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="glass-card rounded-2xl p-8 flex flex-col items-center justify-center">
      <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
        Business Health Score
      </h2>
      <div className="relative w-48 h-48">
        <svg className="w-full h-full -rotate-90 gauge-ring" viewBox="0 0 160 160">
          <circle
            cx="80" cy="80" r="70"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="10"
          />
          <circle
            cx="80" cy="80" r="70"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold text-foreground font-mono">{score}</span>
          <span className="text-xs text-muted-foreground mt-1">out of 100</span>
        </div>
      </div>
      <p className={`text-sm mt-4 font-medium ${score >= 70 ? 'text-success' : score >= 40 ? 'text-warning' : 'text-danger'}`}>
        ● {score >= 70 ? 'Healthy' : score >= 40 ? 'Needs Attention' : 'Critical'}
      </p>
    </div>
  );
}
