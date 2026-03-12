import { useState, useCallback, useRef } from "react";
import type { AppState, AppAction, Experiment, VariantData } from "../types";
import { callClaude, parseJsonResponse } from "../lib/api";
import { EXPERIMENT_GENERATION_SYSTEM, VARIANT_BUILDER_SYSTEM } from "../lib/prompts";
import { Loader2, GripVertical, ChevronDown, ChevronUp, Rocket } from "lucide-react";
import { cn } from "../lib/utils";

interface ExperimentsProps {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export function Experiments({ state, dispatch }: ExperimentsProps) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [launching, setLaunching] = useState(false);
  const [launchProgress, setLaunchProgress] = useState({ current: 0, total: 0, currentId: "" });
  const abortRef = useRef(false);

  const generateExperiments = useCallback(async () => {
    if (!state.apiKey || state.crawlResults.length === 0) return;
    setGenerating(true);
    setError(null);
    try {
      const context = JSON.stringify({
        crawl_analysis: state.crawlResults,
        baseline_metrics: state.settings.baselineMetrics,
        existing_experiments: state.experiments.map((e) => e.experiment_id),
      });
      const response = await callClaude(
        state.apiKey,
        EXPERIMENT_GENERATION_SYSTEM,
        context,
        8192
      );
      const experiments = parseJsonResponse(response) as Experiment[];
      const withDefaults = experiments.map((e, i) => ({
        ...e,
        experiment_id: e.experiment_id || `EXP-${String(state.experiments.length + i + 1).padStart(3, "0")}`,
        status: "planned" as const,
        iteration: state.iterations.length + 1,
      }));
      dispatch({ type: "ADD_EXPERIMENTS", payload: withDefaults });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }, [state, dispatch]);

  const launchAll = useCallback(async () => {
    if (!state.apiKey) return;
    const planned = state.experiments.filter((e) => e.status === "planned");
    if (planned.length === 0) return;

    setLaunching(true);
    setError(null);
    abortRef.current = false;
    setLaunchProgress({ current: 0, total: planned.length, currentId: "" });

    for (let i = 0; i < planned.length; i++) {
      if (abortRef.current) break;
      const exp = planned[i];
      setLaunchProgress({ current: i + 1, total: planned.length, currentId: exp.experiment_id });

      try {
        const pageAnalysis = state.crawlResults.find(
          (r) => r.url.includes(exp.page) || exp.page.includes(r.url)
        );
        const context = JSON.stringify({ experiment: exp, page_analysis: pageAnalysis || null });
        const response = await callClaude(state.apiKey, VARIANT_BUILDER_SYSTEM, context, 8192);
        const variantData = parseJsonResponse(response) as VariantData;

        dispatch({
          type: "UPDATE_EXPERIMENT",
          payload: { id: exp.experiment_id, updates: { status: "running", builtVariant: variantData } },
        });
      } catch (e: unknown) {
        // Log the error but continue with the rest
        console.error(`Failed to build variant for ${exp.experiment_id}:`, e);
        dispatch({
          type: "UPDATE_EXPERIMENT",
          payload: { id: exp.experiment_id, updates: { status: "running" } },
        });
      }
    }

    setLaunching(false);
  }, [state, dispatch]);

  const stopLaunch = useCallback(() => {
    abortRef.current = true;
  }, []);

  const moveToWave = (id: string, wave: 1 | 2 | 3) => {
    dispatch({ type: "MOVE_EXPERIMENT", payload: { id, wave } });
  };

  const waves = [1, 2, 3] as const;
  const experimentsByWave = (wave: 1 | 2 | 3) =>
    state.experiments.filter((e) => e.wave === wave);

  const effortColor = (effort: string) => {
    switch (effort) {
      case "trivial": return "bg-green-50 text-green-700";
      case "small": return "bg-blue-50 text-blue-700";
      case "medium": return "bg-amber-50 text-amber-700";
      case "large": return "bg-red-50 text-red-700";
      default: return "bg-slate-50 text-slate-700";
    }
  };

  const confidenceColor = (conf: string) => {
    switch (conf) {
      case "high": return "bg-green-50 text-green-700";
      case "medium": return "bg-amber-50 text-amber-700";
      case "low": return "bg-red-50 text-red-700";
      default: return "bg-slate-50 text-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Experiments</h2>
        <div className="flex gap-2">
          <button
            onClick={generateExperiments}
            disabled={generating || launching || state.crawlResults.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {generating && <Loader2 size={14} className="animate-spin" />}
            {generating ? "Generating..." : "Generate Experiments"}
          </button>
          {launching ? (
            <button
              onClick={stopLaunch}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={launchAll}
              disabled={generating || state.experiments.filter((e) => e.status === "planned").length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              <Rocket size={14} />
              Launch All
            </button>
          )}
        </div>
      </div>

      {launching && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-emerald-800 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Building & launching {launchProgress.currentId}...
            </p>
            <span className="text-xs text-emerald-600">
              {launchProgress.current} / {launchProgress.total}
            </span>
          </div>
          <div className="w-full bg-emerald-200 rounded-full h-2">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(launchProgress.current / launchProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {state.crawlResults.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          Crawl and analyse pages first to generate experiments.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Kanban board */}
      <div className="grid grid-cols-3 gap-4">
        {waves.map((wave) => (
          <div key={wave} className="bg-slate-50 rounded-lg p-3">
            <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center justify-between">
              <span>
                Wave {wave}
                {wave === 1 && " — Quick Wins"}
                {wave === 2 && " — Structural"}
                {wave === 3 && " — Advanced"}
              </span>
              <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                {experimentsByWave(wave).length}
              </span>
            </h3>

            <div className="space-y-2">
              {experimentsByWave(wave).map((exp) => (
                <div
                  key={exp.experiment_id}
                  className="bg-white rounded-md border border-slate-200 p-3 shadow-sm"
                >
                  <div className="flex items-start gap-2">
                    <GripVertical size={14} className="text-slate-300 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-400">
                          {exp.experiment_id}
                        </span>
                        <span className={cn("text-xs px-1.5 py-0.5 rounded", effortColor(exp.implementation_effort))}>
                          {exp.implementation_effort}
                        </span>
                        {exp.status === "running" && (
                          <span className="text-xs bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                            running
                          </span>
                        )}
                        {exp.status === "completed" && (
                          <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                            completed
                          </span>
                        )}
                        {exp.iteration > 1 && (
                          <span className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">
                            Iter {exp.iteration}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-800 leading-snug">
                        {expandedId === exp.experiment_id
                          ? exp.hypothesis
                          : exp.hypothesis.slice(0, 100) + (exp.hypothesis.length > 100 ? "..." : "")}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-slate-500">{exp.page}</span>
                        <span className={cn("text-xs px-1.5 py-0.5 rounded", confidenceColor(exp.confidence))}>
                          {exp.confidence}
                        </span>
                        <span className="text-xs text-green-700 font-medium">
                          {exp.estimated_lift}
                        </span>
                      </div>

                      {expandedId === exp.experiment_id && (
                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                          <div>
                            <p className="text-xs font-medium text-slate-500">Control (A)</p>
                            <p className="text-xs text-slate-700">{exp.variant_a.description}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500">Variant (B)</p>
                            <p className="text-xs text-slate-700">{exp.variant_b.description}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500">Benchmark</p>
                            <p className="text-xs text-slate-700">{exp.benchmark_reference}</p>
                          </div>
                          <div className="flex gap-1 mt-2">
                            {waves.filter((w) => w !== exp.wave).map((w) => (
                              <button
                                key={w}
                                onClick={() => moveToWave(exp.experiment_id, w)}
                                className="text-xs px-2 py-1 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
                              >
                                Move to Wave {w}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() =>
                          setExpandedId(
                            expandedId === exp.experiment_id ? null : exp.experiment_id
                          )
                        }
                        className="mt-1 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                      >
                        {expandedId === exp.experiment_id ? (
                          <>
                            <ChevronUp size={12} /> Less
                          </>
                        ) : (
                          <>
                            <ChevronDown size={12} /> More
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
