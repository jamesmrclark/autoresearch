import { cn } from "../lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function MetricCard({ title, value, subtitle, trend, className }: MetricCardProps) {
  return (
    <div className={cn("bg-white rounded-lg border border-slate-200 p-5", className)}>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
      <p className={cn(
        "text-2xl font-bold mt-1",
        trend === "up" && "text-green-600",
        trend === "down" && "text-red-600",
        (!trend || trend === "neutral") && "text-slate-900"
      )}>
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
}
