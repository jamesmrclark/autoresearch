export interface PageAnalysis {
  url: string;
  page_type: "homepage" | "landing_page" | "pricing" | "content" | "conversion" | "trust";
  primary_cta: { text: string; destination: string; above_fold: boolean };
  secondary_ctas: { text: string; destination: string }[];
  value_proposition: { headline: string; clarity_score: number; urgency_score: number };
  trust_signals: { logos: number; testimonials: number; data_points: number; case_studies: number };
  friction_points: string[];
  content_length_words: number;
  form_fields: number;
  social_proof_score: number;
  mobile_concerns: string[];
  persona_alignment: {
    scaling_sophie: number;
    homeware_harry: number;
    wellness_wendy: number;
    luxury_liam: number;
  };
  conversion_barriers: string[];
  opportunities: string[];
}

export interface Experiment {
  experiment_id: string;
  page: string;
  hypothesis: string;
  change_type: "copy" | "layout" | "cta" | "social_proof" | "form" | "speed" | "navigation";
  priority_score: number;
  estimated_lift: string;
  confidence: "high" | "medium" | "low";
  variant_a: { description: string; code_or_copy: string };
  variant_b: { description: string; code_or_copy: string };
  success_metric: string;
  benchmark_reference: string;
  implementation_effort: "trivial" | "small" | "medium" | "large";
  wave: 1 | 2 | 3;
  status: "planned" | "running" | "completed" | "discarded";
  result?: ExperimentResult;
  builtVariant?: VariantData;
  controlScores?: CroScores;
  variantScores?: CroScores;
  iteration: number;
}

export interface VariantData {
  experiment_id: string;
  control_description: string;
  variant_description: string;
  changes: Array<{ element: string; before: string; after: string }>;
  full_variant_snippet: string;
  rationale: string;
}

export interface CroScores {
  clarity: number;
  urgency: number;
  trust: number;
  friction: number;
  mobile_readiness: number;
  notes: string;
  average: number;
}

export interface ExperimentResult {
  date_started: string;
  date_ended: string;
  control_rate: number;
  variant_rate: number;
  sample_size: number;
  statistical_significance: number;
  winner: "control" | "variant" | "inconclusive";
  notes: string;
}

export interface Iteration {
  iteration_number: number;
  timestamp: string;
  experiments_completed: string[];
  new_experiments_generated: string[];
  cumulative_lift: number;
  reasoning: string;
}

export interface BaselineMetrics {
  total_sessions: number;
  monthly_sessions: number;
  sitewide_key_event_rate: number;
  pages: Record<string, { sessions: number; key_event_rate: number; engagement_rate?: number }>;
  channels: Record<string, { sessions: number; key_event_rate: number; cpc?: number }>;
}

export interface AppState {
  apiKey: string | null;
  crawlResults: PageAnalysis[];
  experiments: Experiment[];
  iterations: Iteration[];
  settings: {
    siteUrl: string;
    baselineMetrics: BaselineMetrics;
  };
}

export type AppAction =
  | { type: "SET_API_KEY"; payload: string }
  | { type: "ADD_CRAWL_RESULT"; payload: PageAnalysis }
  | { type: "SET_CRAWL_RESULTS"; payload: PageAnalysis[] }
  | { type: "SET_EXPERIMENTS"; payload: Experiment[] }
  | { type: "ADD_EXPERIMENTS"; payload: Experiment[] }
  | { type: "UPDATE_EXPERIMENT"; payload: { id: string; updates: Partial<Experiment> } }
  | { type: "MOVE_EXPERIMENT"; payload: { id: string; wave: 1 | 2 | 3 } }
  | { type: "ADD_ITERATION"; payload: Iteration }
  | { type: "RESET_ALL" };

export type Page = "dashboard" | "crawl" | "experiments" | "variants" | "results" | "scorecard";
