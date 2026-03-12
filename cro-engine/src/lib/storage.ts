import type { AppState } from "../types";
import { STORAGE_KEY, API_KEY_STORAGE, BASELINE_METRICS, DEFAULT_SITE_URL } from "./constants";

export const defaultState: AppState = {
  apiKey: null,
  crawlResults: [],
  experiments: [],
  iterations: [],
  settings: {
    siteUrl: DEFAULT_SITE_URL,
    baselineMetrics: BASELINE_METRICS,
  },
};

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const apiKey = localStorage.getItem(API_KEY_STORAGE);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      ...defaultState,
      ...parsed,
      apiKey: apiKey || null,
    };
  } catch {
    return defaultState;
  }
}

export function saveState(state: AppState): void {
  try {
    const { apiKey, ...rest } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
    if (apiKey) {
      localStorage.setItem(API_KEY_STORAGE, apiKey);
    }
  } catch {
    // localStorage full or unavailable
  }
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(API_KEY_STORAGE);
}
