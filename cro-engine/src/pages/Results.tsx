import { useState, useCallback } from "react";
import type { AppState, AppAction, ExperimentResult, Experiment, Iteration } from "../types";
import { callClaude, parseJsonResponse } from "../lib/api";
import { ITERATION_SYSTEM } from "../lib/prompts";
import { zTestSignificance, significanceLabel } from "../lib/stats";
import { Loader2, RefreshCw, Trophy, X, Minus } from "lucide-react";
import { cn } from "../lib/utils";

interface ResultsProps {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export function Results({ state, dispatch }: ResultsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<ExperimentResult>>({});
  const [iterating, setIterating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEditing = (exp: typeof state.experiments[0]) => {
    setEditingId(exp.experiment_id);
    setForm(
      exp.result || {
        date_started: new Date().toISOString().split("T")[0],
        date_ended: new Date().toISOString().split("T")[0],
        control_rate: 0,
        variant_rate: 0,
        sample_size: 0,
        statistical_significance: 1,
        winner: "inconclusive",
        notes: "",
      }
    );
  };

  const saveResult = useCallback(() => {
    if (!editingId || !form) return;
    const sig = zTestSignificance(
      form.control_rate || 0,
      form.variant_rate || 0,
      form.sample_size || 0
    );
    const result: ExperimentResult = {
      date_started: form.date_started || "",
      date_ended: form.date_ended || "",
      control_rate: form.control_rate || 0,
      variant_rate: form.variant_rate || 0,
      sample_size: form.sample_size || 0,
      statistical_significance: sig,
      winner: form.winner as "control" | "variant" | "inconclusive",
      notes: form.notes || "",
    };
    dispatch({
      type: "UPDATE_EXPERIMENT",
      payload: { id: editingId, updates: { status: "completed", result } },
    });
    setEditingId(null);
    setForm({});
  }, [editingId, form, dispatch]);

  const setStatus = (id: string, status: Experiment["status"]) => {
    dispatch({ type: "UPDATE_EXPERIMENT", payload: { id, updates: { status } } });
  };

  const triggerIteration = useCallback(async () => {
    if (!state.apiKey) return;
    setIterating(true);
    setError(null);
    try {
      const completed = state.experiments.filter((e) => e.status === "completed");
      const context = JSON.stringify({
        completed_experiments: completed.map((e) => ({
          id: e.experiment_id,
          hypothesis: e.hypothesis,
          page: e.page,
          wave: e.wave,
          result: e.result,
        })),
        remaining_planned: state.experiments
          .filter((e) => e.status === "planned")
          .map((e) => e.experiment_id),
        baseline_metrics: state.settings.baselineMetrics,
      });

      const response = await callClaude(state.apiKey, ITERATION_SYSTEM, context, 8192);
      const newExperiments = parseJsonResponse(response) as Experiment[];
      const iterNum = state.iterations.length + 1;
      const withDefaults = newExperiments.map((e, i) => ({
        ...e,
        experiment_id: e.experiment_id || `EXP-${String(state.experiments.length + i + 1).padStart(3, "0")}`,
        status: "planned" as const,
        iteration: iterNum,
      }));

      dispatch({ type: "ADD_EXPERIMENTS", payload: withDefaults });

      const winners = completed.filter((e) => e.result?.winner === "variant");
      const cumulativeLift = winners.reduce(
        (s, e) => s + ((e.result?.variant_rate || 0) - (e.result?.control_rate || 0)),
        0
      );

      const iteration: Iteration = {
        iteration_number: iterNum,
        timestamp: new Date().toISOString(),
        experiments_completed: completed.map((e) => e.experiment_id),
        new_experiments_generated: withDefaults.map((e) => e.experiment_id),
        cumulative_lift: cumulativeLift,
        reasoning: `Generated ${withDefaults.length} new experiments based on ${completed.length} completed results (${winners.length} winners).`,
      };
      dispatch({ type: "ADD_ITERATION", payload: iteration });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Iteration failed");
    } finally {
      setIterating(false);
    }
  }, [state, dispatch]);

  const winnerIcon = (winner?: string) => {
    if (winner === "variant") return <Trophy size={14} className="text-green-600" />;
    if (winner === "control") return <X size={14} className="text-red-600" />;
    return <Minus size={14} className="text-slate-400" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Results & Iteration</h2>
        <button
          onClick={triggerIteration}
          disabled={iterating || state.experiments.filter((e) => e.status === "completed").length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {iterating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {iterating ? "Iterating..." : "Trigger Iteration"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Iteration timeline */}
      {state.iterations.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-purple-900 mb-2">Iteration History</h3>
          <div className="space-y-2">
            {state.iterations.map((iter) => (
              <div key={iter.iteration_number} className="text-xs text-purple-800">
                <span className="font-medium">Iteration {iter.iteration_number}</span>{" "}
                ({new Date(iter.timestamp).toLocaleDateString()}) — {iter.reasoning}
                <span className="ml-2 font-medium text-green-700">
                  +{iter.cumulative_lift.toFixed(2)}% cumulative lift
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Experiments table */}
      {state.experiments.length > 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-medium text-slate-600">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Hypothesis</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Status</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Control</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Variant</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Sig.</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Winner</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.experiments.map((exp) => (
                  <tr key={exp.experiment_id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {exp.experiment_id}
                    </td>
                    <td className="px-4 py-3 max-w-[300px] truncate text-slate-800">
                      {exp.hypothesis}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <select
                        value={exp.status}
                        onChange={(e) => setStatus(exp.experiment_id, e.target.value as Experiment["status"])}
                        className={cn(
                          "text-xs px-2 py-1 rounded border-0",
                          exp.status === "completed" && "bg-green-50 text-green-700",
                          exp.status === "running" && "bg-blue-50 text-blue-700",
                          exp.status === "planned" && "bg-slate-100 text-slate-600",
                          exp.status === "discarded" && "bg-red-50 text-red-700"
                        )}
                      >
                        <option value="planned">Planned</option>
                        <option value="running">Running</option>
                        <option value="completed">Completed</option>
                        <option value="discarded">Discarded</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center text-xs">
                      {exp.result ? `${exp.result.control_rate}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-center text-xs">
                      {exp.result ? `${exp.result.variant_rate}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-center text-xs">
                      {exp.result ? (
                        <span title={significanceLabel(exp.result.statistical_significance)}>
                          p={exp.result.statistical_significance.toFixed(3)}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {exp.result ? winnerIcon(exp.result.winner) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => startEditing(exp)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Log Result
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-sm text-slate-500 text-center py-8">
          No experiments yet. Generate experiments on the Experiments page.
        </div>
      )}

      {/* Edit result modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Log Result — {editingId}
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={form.date_started || ""}
                    onChange={(e) => setForm({ ...form, date_started: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={form.date_ended || ""}
                    onChange={(e) => setForm({ ...form, date_ended: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Control Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.control_rate || ""}
                    onChange={(e) => setForm({ ...form, control_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Variant Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.variant_rate || ""}
                    onChange={(e) => setForm({ ...form, variant_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Total Sample Size</label>
                <input
                  type="number"
                  value={form.sample_size || ""}
                  onChange={(e) => setForm({ ...form, sample_size: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Winner</label>
                <select
                  value={form.winner || "inconclusive"}
                  onChange={(e) => setForm({ ...form, winner: e.target.value as ExperimentResult["winner"] })}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                >
                  <option value="variant">Variant</option>
                  <option value="control">Control</option>
                  <option value="inconclusive">Inconclusive</option>
                </select>
              </div>
              {form.control_rate && form.variant_rate && form.sample_size ? (
                <p className="text-xs text-slate-500">
                  Auto-calculated: {significanceLabel(
                    zTestSignificance(form.control_rate, form.variant_rate, form.sample_size)
                  )} (p={zTestSignificance(form.control_rate, form.variant_rate, form.sample_size).toFixed(4)})
                </p>
              ) : null}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                <textarea
                  value={form.notes || ""}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm resize-y"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setEditingId(null)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  onClick={saveResult}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  Save Result
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
