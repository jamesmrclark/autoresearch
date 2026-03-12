import { useState } from "react";

interface ApiKeyDialogProps {
  onSubmit: (key: string) => void;
}

export function ApiKeyDialog({ onSubmit }: ApiKeyDialogProps) {
  const [key, setKey] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Rove CRO Engine
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          Enter your Anthropic API key to get started. Your key is stored locally
          and only sent directly to api.anthropic.com.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (key.trim()) onSubmit(key.trim());
          }}
        >
          <label className="block text-sm font-medium text-slate-700 mb-1">
            API Key
          </label>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!key.trim()}
            className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Get Started
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-400 text-center">
          Get an API key at{" "}
          <a
            href="https://console.anthropic.com/"
            target="_blank"
            rel="noopener"
            className="text-blue-500 hover:underline"
          >
            console.anthropic.com
          </a>
        </p>
      </div>
    </div>
  );
}
