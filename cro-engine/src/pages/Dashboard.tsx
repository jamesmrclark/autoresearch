import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import { MetricCard } from "../components/MetricCard";
import type { AppState } from "../types";
import { Download } from "lucide-react";

interface DashboardProps {
  state: AppState;
}

export function Dashboard({ state }: DashboardProps) {
  const { experiments, crawlResults, iterations } = state;
  const baseline = state.settings.baselineMetrics;

  const stats = useMemo(() => {
    const completed = experiments.filter((e) => e.status === "completed");
    const winners = completed.filter((e) => e.result?.winner === "variant");
    const totalLift = winners.reduce((sum, e) => {
      if (!e.result) return sum;
      return sum + (e.result.variant_rate - e.result.control_rate);
    }, 0);
    const currentRate = 0.68 + totalLift;
    const monthlyRevenue = baseline.monthly_sessions * (currentRate / 100) * 225;

    return {
      currentRate: currentRate.toFixed(2),
      totalExperiments: experiments.length,
      running: experiments.filter((e) => e.status === "running").length,
      completed: completed.length,
      winRate: completed.length > 0
        ? ((winners.length / completed.length) * 100).toFixed(0)
        : "—",
      monthlyRevenue: `£${monthlyRevenue.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`,
      iterationCount: iterations.length,
    };
  }, [experiments, iterations, baseline]);

  const trendData = useMemo(() => {
    let rate = 0.68;
    const points = [{ name: "Baseline", rate: 0.68 }];
    const completed = experiments
      .filter((e) => e.status === "completed" && e.result)
      .sort((a, b) => (a.result!.date_ended > b.result!.date_ended ? 1 : -1));
    for (const exp of completed) {
      if (exp.result?.winner === "variant") {
        rate += exp.result.variant_rate - exp.result.control_rate;
      }
      points.push({ name: exp.experiment_id, rate: parseFloat(rate.toFixed(2)) });
    }
    return points;
  }, [experiments]);

  const radarData = useMemo(() => {
    if (crawlResults.length === 0) return [];
    const avg = (key: "clarity_score" | "urgency_score") =>
      crawlResults.reduce((s, r) => s + r.value_proposition[key], 0) / crawlResults.length;
    const avgTrust =
      crawlResults.reduce((s, r) => s + r.social_proof_score, 0) / crawlResults.length;
    return [
      { dimension: "Clarity", score: avg("clarity_score") },
      { dimension: "Urgency", score: avg("urgency_score") },
      { dimension: "Trust", score: avgTrust },
      { dimension: "Forms", score: crawlResults.reduce((s, r) => s + Math.max(0, 10 - r.form_fields), 0) / crawlResults.length },
      { dimension: "Personas", score: crawlResults.reduce((s, r) => s + (r.persona_alignment.scaling_sophie + r.persona_alignment.homeware_harry + r.persona_alignment.wellness_wendy + r.persona_alignment.luxury_liam) / 4, 0) / crawlResults.length },
    ];
  }, [crawlResults]);

  function downloadReport() {
    const lines = [
      "# CRO Experiment Report — Rove",
      `Generated: ${new Date().toISOString().split("T")[0]}`,
      "",
      "## Summary",
      `- Current estimated conversion rate: ${stats.currentRate}%`,
      `- Total experiments: ${stats.totalExperiments}`,
      `- Win rate: ${stats.winRate}%`,
      `- Estimated monthly revenue: ${stats.monthlyRevenue}`,
      `- Iterations: ${stats.iterationCount}`,
      "",
      "## Experiments",
      ...experiments.map(
        (e) =>
          `- **${e.experiment_id}** [${e.status}] ${e.hypothesis} (Wave ${e.wave}, ${e.confidence} confidence)`
      ),
      "",
      "## Completed Results",
      ...experiments
        .filter((e) => e.result)
        .map(
          (e) =>
            `- ${e.experiment_id}: Control ${e.result!.control_rate}% vs Variant ${e.result!.variant_rate}% → ${e.result!.winner} (p=${e.result!.statistical_significance.toFixed(3)})`
        ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cro-report.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Dashboard</h2>
        <button
          onClick={downloadReport}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
        >
          <Download size={14} />
          Download Report
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Conversion Rate"
          value={`${stats.currentRate}%`}
          subtitle="Baseline: 0.68%"
          trend={parseFloat(stats.currentRate) > 0.68 ? "up" : "neutral"}
        />
        <MetricCard
          title="Experiments"
          value={stats.totalExperiments}
          subtitle={`${stats.running} running, ${stats.completed} completed`}
        />
        <MetricCard
          title="Win Rate"
          value={`${stats.winRate}%`}
          subtitle={`${stats.iterationCount} iterations`}
        />
        <MetricCard
          title="Est. Monthly Revenue"
          value={stats.monthlyRevenue}
          subtitle={`${baseline.monthly_sessions} sessions/mo × ARPU £225`}
          trend="up"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="text-sm font-medium text-slate-700 mb-4">Conversion Rate Trend</h3>
          {trendData.length > 1 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, "auto"]} unit="%" />
                <Tooltip />
                <Line type="monotone" dataKey="rate" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-sm text-slate-400">
              Complete experiments to see conversion trends
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="text-sm font-medium text-slate-700 mb-4">CRO Score Radar</h3>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                <Radar dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-sm text-slate-400">
              Crawl pages to see CRO scores
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h3 className="text-sm font-medium text-slate-700 mb-4">Revenue Impact Calculator</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 text-slate-500 font-medium">Conversion Rate</th>
                <th className="text-right py-2 text-slate-500 font-medium">Monthly Signups</th>
                <th className="text-right py-2 text-slate-500 font-medium">Monthly Revenue (5% paid)</th>
                <th className="text-right py-2 text-slate-500 font-medium">Annual Revenue</th>
              </tr>
            </thead>
            <tbody>
              {[0.68, 1, 2, 3, 5, 8].map((rate) => {
                const signups = Math.round(baseline.monthly_sessions * (rate / 100));
                const paid = Math.round(signups * 0.05);
                const monthly = paid * 225;
                const annual = monthly * 12;
                return (
                  <tr key={rate} className="border-b border-slate-100">
                    <td className="py-2 font-medium">
                      {rate}%{rate === 0.68 && " (current)"}
                    </td>
                    <td className="text-right py-2">{signups}</td>
                    <td className="text-right py-2">£{monthly.toLocaleString("en-GB")}</td>
                    <td className="text-right py-2 font-medium">£{annual.toLocaleString("en-GB")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
