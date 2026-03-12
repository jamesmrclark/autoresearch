import { useReducer, useEffect, useCallback } from "react";
import type { AppState, AppAction } from "../types";
import { loadState, saveState, clearState, defaultState } from "../lib/storage";

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_API_KEY":
      return { ...state, apiKey: action.payload };

    case "ADD_CRAWL_RESULT":
      return {
        ...state,
        crawlResults: [
          ...state.crawlResults.filter((r) => r.url !== action.payload.url),
          action.payload,
        ],
      };

    case "SET_CRAWL_RESULTS":
      return { ...state, crawlResults: action.payload };

    case "SET_EXPERIMENTS":
      return { ...state, experiments: action.payload };

    case "ADD_EXPERIMENTS":
      return {
        ...state,
        experiments: [...state.experiments, ...action.payload],
      };

    case "UPDATE_EXPERIMENT":
      return {
        ...state,
        experiments: state.experiments.map((e) =>
          e.experiment_id === action.payload.id
            ? { ...e, ...action.payload.updates }
            : e
        ),
      };

    case "MOVE_EXPERIMENT":
      return {
        ...state,
        experiments: state.experiments.map((e) =>
          e.experiment_id === action.payload.id
            ? { ...e, wave: action.payload.wave }
            : e
        ),
      };

    case "ADD_ITERATION":
      return {
        ...state,
        iterations: [...state.iterations, action.payload],
      };

    case "RESET_ALL":
      clearState();
      return defaultState;

    default:
      return state;
  }
}

export function useAppState() {
  const [state, rawDispatch] = useReducer(reducer, null, loadState);

  // Persist on every state change
  useEffect(() => {
    saveState(state);
  }, [state]);

  const dispatch = useCallback((action: AppAction) => {
    rawDispatch(action);
  }, []);

  return { state, dispatch };
}
