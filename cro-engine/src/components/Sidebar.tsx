import { cn } from "../lib/utils";
import type { Page } from "../types";
import {
  LayoutDashboard,
  Search,
  FlaskConical,
  SplitSquareVertical,
  BarChart3,
  Settings,
} from "lucide-react";

const NAV_ITEMS: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "crawl", label: "Crawl & Analyse", icon: Search },
  { id: "experiments", label: "Experiments", icon: FlaskConical },
  { id: "variants", label: "Variants", icon: SplitSquareVertical },
  { id: "results", label: "Results", icon: BarChart3 },
];

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  onReset: () => void;
}

export function Sidebar({ activePage, onNavigate, onReset }: SidebarProps) {
  return (
    <aside className="w-56 bg-slate-900 text-slate-300 flex flex-col min-h-screen shrink-0">
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-lg font-bold text-white tracking-tight">
          Rove CRO Engine
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">Experimentation Platform</p>
      </div>

      <nav className="flex-1 py-2">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
              activePage === id
                ? "bg-slate-800 text-white border-r-2 border-blue-500"
                : "hover:bg-slate-800/50 hover:text-white"
            )}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button
          onClick={onReset}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-red-400 transition-colors"
        >
          <Settings size={14} />
          Reset All Data
        </button>
      </div>
    </aside>
  );
}
