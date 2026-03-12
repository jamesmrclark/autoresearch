import { useState, useCallback } from "react";
import type { AppState, AppAction, VariantData } from "../types";
import { callClaude, parseJsonResponse } from "../lib/api";
import { VARIANT_BUILDER_SYSTEM } from "../lib/prompts";
import { Loader2, Copy, Download, CheckCircle2 } from "lucide-react";
import { cn } from "../lib/utils";

interface VariantsProps {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export function Variants({ state }: VariantsProps) {
  const [selectedId, setSelectedId] = useState("");
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [variant, setVariant] = useState<VariantData | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedExperiment = state.experiments.find(
    (e) => e.experiment_id === selectedId
  );

  const buildVariant = useCallback(async () => {
    if (!state.apiKey || !selectedExperiment) return;
    setBuilding(true);
    setError(null);
    setVariant(null);
    try {
      // Find page HTML from crawl results
      const pageAnalysis = state.crawlResults.find(
        (r) => r.url.includes(selectedExperiment.page) || selectedExperiment.page.includes(r.url)
      );

      const context = JSON.stringify({
        experiment: selectedExperiment,
        page_analysis: pageAnalysis || null,
      });

      const response = await callClaude(
        state.apiKey,
        VARIANT_BUILDER_SYSTEM,
        context,
        8192
      );
      const result = parseJsonResponse(response) as VariantData;
      setVariant(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Build failed");
    } finally {
      setBuilding(false);
    }
  }, [state, selectedExperiment]);

  const copyToClipboard = useCallback(async () => {
    if (variant?.full_variant_snippet) {
      await navigator.clipboard.writeText(variant.full_variant_snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [variant]);

  const exportHtml = useCallback(() => {
    if (!variant?.full_variant_snippet) return;
    const blob = new Blob([variant.full_variant_snippet], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `variant-${selectedId}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [variant, selectedId]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Variant Builder</h2>

      {state.experiments.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          Generate experiments first to build variants.
        </div>
      ) : (
        <>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Select Experiment
              </label>
              <select
                value={selectedId}
                onChange={(e) => {
                  setSelectedId(e.target.value);
                  const exp = state.experiments.find((ex) => ex.experiment_id === e.target.value);
                  setVariant(exp?.builtVariant || null);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              >
                <option value="">Choose an experiment...</option>
                {state.experiments.map((e) => (
                  <option key={e.experiment_id} value={e.experiment_id}>
                    {e.experiment_id} — {e.hypothesis.slice(0, 80)}...
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={buildVariant}
              disabled={!selectedId || building}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {building && <Loader2 size={14} className="animate-spin" />}
              Build Variant
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          {variant && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 text-sm">
                <p className="font-medium text-slate-700 mb-1">Rationale</p>
                <p className="text-slate-600">{variant.rationale}</p>
              </div>

              {/* Side-by-side changes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-red-700 mb-2">
                    Control (Current)
                  </h3>
                  <div className="bg-white border border-red-200 rounded-lg p-4 space-y-3">
                    {variant.changes.map((c, i) => (
                      <div key={i}>
                        <p className="text-xs text-slate-500 font-mono mb-1">
                          {c.element}
                        </p>
                        <pre className="text-sm bg-red-50 p-2 rounded whitespace-pre-wrap break-words text-red-900">
                          {c.before}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-green-700 mb-2">
                    Variant (Proposed)
                  </h3>
                  <div className="bg-white border border-green-200 rounded-lg p-4 space-y-3">
                    {variant.changes.map((c, i) => (
                      <div key={i}>
                        <p className="text-xs text-slate-500 font-mono mb-1">
                          {c.element}
                        </p>
                        <pre className="text-sm bg-green-50 p-2 rounded whitespace-pre-wrap break-words text-green-900">
                          {c.after}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Full snippet preview */}
              {variant.full_variant_snippet && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-slate-700">
                      Full Variant Snippet
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={copyToClipboard}
                        className={cn(
                          "flex items-center gap-1 px-3 py-1.5 text-xs rounded-md transition-colors",
                          copied
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                      >
                        {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                        {copied ? "Copied!" : "Copy"}
                      </button>
                      <button
                        onClick={exportHtml}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-colors"
                      >
                        <Download size={12} />
                        Export HTML
                      </button>
                    </div>
                  </div>
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto max-h-[400px] overflow-y-auto">
                    {variant.full_variant_snippet}
                  </pre>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
