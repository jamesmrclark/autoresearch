import { useState } from "react";
import { useAppState } from "./hooks/useAppState";
import { Sidebar } from "./components/Sidebar";
import { ApiKeyDialog } from "./components/ApiKeyDialog";
import { Dashboard } from "./pages/Dashboard";
import { Crawl } from "./pages/Crawl";
import { Experiments } from "./pages/Experiments";
import { Variants } from "./pages/Variants";
import { Results } from "./pages/Results";
import type { Page } from "./types";

function App() {
  const { state, dispatch } = useAppState();
  const [page, setPage] = useState<Page>("dashboard");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!state.apiKey) {
    return (
      <ApiKeyDialog onSubmit={(key) => dispatch({ type: "SET_API_KEY", payload: key })} />
    );
  }

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    dispatch({ type: "RESET_ALL" });
    setShowResetConfirm(false);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activePage={page} onNavigate={setPage} onReset={handleReset} />

      <main className="flex-1 p-8 overflow-y-auto">
        {page === "dashboard" && <Dashboard state={state} />}
        {page === "crawl" && <Crawl state={state} dispatch={dispatch} />}
        {page === "experiments" && <Experiments state={state} dispatch={dispatch} />}
        {page === "variants" && <Variants state={state} dispatch={dispatch} />}
        {page === "results" && <Results state={state} dispatch={dispatch} />}
      </main>

      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Reset All Data?</h3>
            <p className="text-sm text-slate-600 mb-4">
              This will delete all crawl results, experiments, iterations, and your API key.
              This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={confirmReset}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
              >
                Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
