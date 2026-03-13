import { useState } from "react";
import type { AppState, CroScores } from "../types";
import { cn } from "../lib/utils";
import { Eye, EyeOff, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ScorecardProps {
  state: AppState;
}

const DIMENSIONS = ["clarity", "urgency", "trust", "friction", "mobile_readiness"] as const;

const DIMENSION_LABELS: Record<string, string> = {
  clarity: "Clarity",
  urgency: "Urgency",
  trust: "Trust",
  friction: "Friction (low = good)",
  mobile_readiness: "Mobile Readiness",
};

function ScoreBar({ label, control, variant }: { label: string; control: number; variant: number }) {
  const delta = variant - control;
  const improved = delta > 0;
  const same = delta === 0;

  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-32 text-slate-600 shrink-0">{label}</span>
      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 relative h-5">
          <div
            className="absolute inset-y-0 left-0 bg-slate-300 rounded-sm"
            style={{ width: `${(control / 10) * 100}%` }}
          />
          <span className="absolute inset-y-0 left-1 flex items-center text-[10px] font-medium text-slate-700">
            {control.toFixed(1)}
          </span>
        </div>
        <div className="flex-1 relative h-5">
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-sm",
              improved ? "bg-emerald-400" : same ? "bg-slate-300" : "bg-red-300"
            )}
            style={{ width: `${(variant / 10) * 100}%` }}
          />
          <span className="absolute inset-y-0 left-1 flex items-center text-[10px] font-medium text-slate-700">
            {variant.toFixed(1)}
          </span>
        </div>
        <span
          className={cn(
            "w-12 text-right font-medium",
            improved ? "text-emerald-700" : same ? "text-slate-500" : "text-red-600"
          )}
        >
          {improved ? "+" : ""}
          {delta.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

function DeltaIcon({ delta }: { delta: number }) {
  if (delta > 0.3) return <TrendingUp size={14} className="text-emerald-600" />;
  if (delta < -0.3) return <TrendingDown size={14} className="text-red-600" />;
  return <Minus size={14} className="text-slate-400" />;
}

export function Scorecard({ state }: ScorecardProps) {
  const [previewId, setPreviewId] = useState<string | null>(null);

  const scored = state.experiments.filter((e) => e.controlScores && e.variantScores);

  // Aggregate averages
  const avgControl: Record<string, number> = {};
  const avgVariant: Record<string, number> = {};
  if (scored.length > 0) {
    for (const dim of DIMENSIONS) {
      avgControl[dim] =
        scored.reduce((s, e) => s + (e.controlScores?.[dim] || 0), 0) / scored.length;
      avgVariant[dim] =
        scored.reduce((s, e) => s + (e.variantScores?.[dim] || 0), 0) / scored.length;
    }
  }

  const overallControlAvg =
    scored.length > 0
      ? scored.reduce((s, e) => s + (e.controlScores?.average || 0), 0) / scored.length
      : 0;
  const overallVariantAvg =
    scored.length > 0
      ? scored.reduce((s, e) => s + (e.variantScores?.average || 0), 0) / scored.length
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Scorecard</h2>
        <span className="text-sm text-slate-500">
          {scored.length} experiment{scored.length !== 1 ? "s" : ""} scored
        </span>
      </div>

      {scored.length === 0 ? (
        <div className="text-sm text-slate-500 text-center py-8">
          No scored experiments yet. Use "Launch All" on the Experiments page to build and score variants.
        </div>
      ) : (
        <>
          {/* Aggregate summary */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-1">
              Aggregate CRO Scores
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Average across all {scored.length} scored experiments.
              <span className="ml-2 inline-flex items-center gap-1">
                Overall:
                <span className="font-medium text-slate-700">{overallControlAvg.toFixed(1)}</span>
                <span className="text-slate-400">&rarr;</span>
                <span
                  className={cn(
                    "font-medium",
                    overallVariantAvg > overallControlAvg ? "text-emerald-700" : "text-red-600"
                  )}
                >
                  {overallVariantAvg.toFixed(1)}
                </span>
                <DeltaIcon delta={overallVariantAvg - overallControlAvg} />
              </span>
            </p>
            <div className="flex items-center gap-4 mb-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-slate-300 rounded-sm" /> Control
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-emerald-400 rounded-sm" /> Variant
              </span>
            </div>
            <div className="space-y-2">
              {DIMENSIONS.map((dim) => (
                <ScoreBar
                  key={dim}
                  label={DIMENSION_LABELS[dim]}
                  control={avgControl[dim] || 0}
                  variant={avgVariant[dim] || 0}
                />
              ))}
            </div>
          </div>

          {/* Per-experiment cards */}
          <div className="space-y-4">
            {scored.map((exp) => {
              const cs = exp.controlScores as CroScores;
              const vs = exp.variantScores as CroScores;
              const delta = vs.average - cs.average;
              const showPreview = previewId === exp.experiment_id;

              return (
                <div
                  key={exp.experiment_id}
                  className="bg-white rounded-lg border border-slate-200 overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-4 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-400">
                          {exp.experiment_id}
                        </span>
                        <span className="text-xs text-slate-500">{exp.page}</span>
                        <DeltaIcon delta={delta} />
                        <span
                          className={cn(
                            "text-xs font-medium",
                            delta > 0 ? "text-emerald-700" : delta < 0 ? "text-red-600" : "text-slate-500"
                          )}
                        >
                          {delta > 0 ? "+" : ""}
                          {delta.toFixed(1)} avg
                        </span>
                      </div>
                      <button
                        onClick={() => setPreviewId(showPreview ? null : exp.experiment_id)}
                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800"
                      >
                        {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                        {showPreview ? "Hide Preview" : "Preview"}
                      </button>
                    </div>
                    <p className="text-sm text-slate-800 mt-1 leading-snug">
                      {exp.hypothesis}
                    </p>
                  </div>

                  {/* Score bars */}
                  <div className="p-4 space-y-2">
                    {DIMENSIONS.map((dim) => (
                      <ScoreBar
                        key={dim}
                        label={DIMENSION_LABELS[dim]}
                        control={cs[dim]}
                        variant={vs[dim]}
                      />
                    ))}
                    <div className="pt-2 border-t border-slate-100">
                      <ScoreBar label="Overall Average" control={cs.average} variant={vs.average} />
                    </div>
                  </div>

                  {/* Notes */}
                  {(cs.notes || vs.notes) && (
                    <div className="px-4 pb-3 grid grid-cols-2 gap-3">
                      {cs.notes && (
                        <div className="text-[11px] text-slate-500">
                          <span className="font-medium text-slate-600">Control notes:</span> {cs.notes}
                        </div>
                      )}
                      {vs.notes && (
                        <div className="text-[11px] text-slate-500">
                          <span className="font-medium text-slate-600">Variant notes:</span> {vs.notes}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Visual preview */}
                  {showPreview && exp.builtVariant?.full_variant_snippet && (
                    <div className="border-t border-slate-200">
                      <div className="grid grid-cols-2 divide-x divide-slate-200">
                        <div className="p-3">
                          <h4 className="text-xs font-medium text-slate-600 mb-2">
                            Control
                          </h4>
                          <div className="text-xs text-slate-700 bg-slate-50 rounded p-3 max-h-80 overflow-y-auto whitespace-pre-wrap">
                            {exp.builtVariant.control_description}
                          </div>
                        </div>
                        <div className="p-3">
                          <h4 className="text-xs font-medium text-slate-600 mb-2">
                            Variant — Live Preview
                          </h4>
                          <iframe
                            srcDoc={`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 16px; color: #1e293b; line-height: 1.5; }
    img { max-width: 100%; height: auto; }
    a { color: #2563eb; }
    button, .btn, [class*="btn"] { cursor: pointer; }
  </style>
</head>
<body>${exp.builtVariant.full_variant_snippet}</body>
</html>`}
                            sandbox="allow-same-origin"
                            className="w-full h-[500px] border border-slate-200 rounded bg-white"
                            title={`Preview: ${exp.experiment_id}`}
                          />
                        </div>
                      </div>

                      {/* Changes list */}
                      {exp.builtVariant.changes.length > 0 && (
                        <div className="p-3 border-t border-slate-100">
                          <h4 className="text-xs font-medium text-slate-600 mb-2">Changes Made</h4>
                          <div className="space-y-1.5">
                            {exp.builtVariant.changes.map((c, i) => (
                              <div key={i} className="text-[11px] grid grid-cols-[120px_1fr_1fr] gap-2">
                                <span className="text-slate-500 font-mono truncate">{c.element}</span>
                                <span className="text-red-700 bg-red-50 px-1.5 py-0.5 rounded truncate">
                                  {c.before}
                                </span>
                                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded truncate">
                                  {c.after}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
