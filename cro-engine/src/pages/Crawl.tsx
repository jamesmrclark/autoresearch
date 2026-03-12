import { useState, useCallback } from "react";
import type { AppState, AppAction, PageAnalysis } from "../types";
import { callClaude, parseJsonResponse } from "../lib/api";
import { PAGE_ANALYSIS_SYSTEM } from "../lib/prompts";
import { KEY_PAGES } from "../lib/constants";
import { Upload, Globe, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "../lib/utils";

interface CrawlProps {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export function Crawl({ state, dispatch }: CrawlProps) {
  const [mode, setMode] = useState<"import" | "paste">("import");
  const [pasteUrl, setPasteUrl] = useState("");
  const [pasteHtml, setPasteHtml] = useState("");
  const [analysing, setAnalysing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyseHtml = useCallback(
    async (url: string, html: string) => {
      if (!state.apiKey) return;
      setAnalysing(url);
      setError(null);
      try {
        const truncated = html.slice(0, 30000);
        const response = await callClaude(
          state.apiKey,
          PAGE_ANALYSIS_SYSTEM,
          `URL: ${url}\n\nHTML content:\n${truncated}`
        );
        const result = parseJsonResponse(response) as PageAnalysis;
        result.url = url;
        dispatch({ type: "ADD_CRAWL_RESULT", payload: result });
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Analysis failed");
      } finally {
        setAnalysing(null);
      }
    },
    [state.apiKey, dispatch]
  );

  const handleFileImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const pages = JSON.parse(text) as Array<{ url: string; html: string }>;
        setError(null);
        for (const page of pages) {
          await analyseHtml(page.url, page.html);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Invalid JSON file");
      }
    },
    [analyseHtml]
  );

  const handlePasteSubmit = useCallback(() => {
    if (pasteUrl && pasteHtml) {
      analyseHtml(pasteUrl, pasteHtml);
      setPasteHtml("");
    }
  }, [pasteUrl, pasteHtml, analyseHtml]);

  const scoreColor = (score: number) => {
    if (score >= 7) return "text-green-600 bg-green-50";
    if (score >= 4) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Crawl & Analyse</h2>
        <span className="text-sm text-slate-500">
          {state.crawlResults.length} pages analysed
        </span>
      </div>

      {/* Crawl instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">
          Fetch pages with the crawl script
        </h3>
        <code className="block bg-blue-100 text-blue-800 px-3 py-2 rounded text-xs font-mono">
          node crawl.js {state.settings.siteUrl}/sitemap.xml
        </code>
        <p className="text-xs text-blue-700 mt-2">
          Then import the generated <strong>pages.json</strong> below.
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode("import")}
          className={cn(
            "px-4 py-2 text-sm rounded-md transition-colors",
            mode === "import"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          <Upload size={14} className="inline mr-2" />
          Import JSON
        </button>
        <button
          onClick={() => setMode("paste")}
          className={cn(
            "px-4 py-2 text-sm rounded-md transition-colors",
            mode === "paste"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          <Globe size={14} className="inline mr-2" />
          Paste HTML
        </button>
      </div>

      {mode === "import" && (
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
          <input
            type="file"
            accept=".json"
            onChange={handleFileImport}
            className="hidden"
            id="file-import"
          />
          <label
            htmlFor="file-import"
            className="cursor-pointer text-sm text-slate-600"
          >
            <Upload size={32} className="mx-auto mb-2 text-slate-400" />
            Click to select <strong>pages.json</strong> or drag and drop
          </label>
        </div>
      )}

      {mode === "paste" && (
        <div className="space-y-3">
          <select
            value={pasteUrl}
            onChange={(e) => setPasteUrl(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="">Select a page...</option>
            {KEY_PAGES.map((p) => (
              <option key={p} value={`${state.settings.siteUrl}${p}`}>
                {p}
              </option>
            ))}
          </select>
          <textarea
            value={pasteHtml}
            onChange={(e) => setPasteHtml(e.target.value)}
            placeholder="Paste the full HTML source here..."
            rows={8}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono resize-y"
          />
          <button
            onClick={handlePasteSubmit}
            disabled={!pasteUrl || !pasteHtml || !!analysing}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Analyse Page
          </button>
        </div>
      )}

      {analysing && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <Loader2 size={16} className="animate-spin" />
          Analysing {analysing}...
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Results table */}
      {state.crawlResults.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Page</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Clarity</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Urgency</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Trust</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Forms</th>
                  <th className="px-4 py-3 font-medium text-slate-600">CTA</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Barriers</th>
                </tr>
              </thead>
              <tbody>
                {state.crawlResults.map((r) => (
                  <tr key={r.url} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900 max-w-[200px] truncate">
                      {r.url.replace(state.settings.siteUrl, "")}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">
                        {r.page_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("px-2 py-0.5 rounded text-xs font-medium", scoreColor(r.value_proposition.clarity_score))}>
                        {r.value_proposition.clarity_score}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("px-2 py-0.5 rounded text-xs font-medium", scoreColor(r.value_proposition.urgency_score))}>
                        {r.value_proposition.urgency_score}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("px-2 py-0.5 rounded text-xs font-medium", scoreColor(r.social_proof_score))}>
                        {r.social_proof_score}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{r.form_fields}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="flex items-center justify-center gap-1">
                        {r.primary_cta.above_fold ? (
                          <CheckCircle2 size={14} className="text-green-500" />
                        ) : (
                          <AlertCircle size={14} className="text-red-500" />
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500">
                      {r.conversion_barriers.length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
