import type { BaselineMetrics } from "../types";

export const BASELINE_METRICS: BaselineMetrics = {
  total_sessions: 1918,
  monthly_sessions: 824,
  sitewide_key_event_rate: 8.0,
  pages: {
    "/": { sessions: 633, key_event_rate: 8.2, engagement_rate: 72.2 },
    "/free-trial/": { sessions: 257, key_event_rate: 5.1 },
    "/book-a-demo/": { sessions: 113, key_event_rate: 9.7 },
    "/pricing/": { sessions: 30, key_event_rate: 33.3, engagement_rate: 33.3 },
    "/about-us/": { sessions: 58 , key_event_rate: 0 },
    "/case-study/": { sessions: 30, key_event_rate: 0 },
    "/roi-calculator/": { sessions: 27, key_event_rate: 14.8 },
    "/partners/chamber-international/": { sessions: 0, key_event_rate: 0 },
    "/blog/": { sessions: 0, key_event_rate: 0 },
    "/webinars/": { sessions: 0, key_event_rate: 0 },
  },
  channels: {
    "google_ads": { sessions: 295, key_event_rate: 10.2, cpc: 2.25 },
    "linkedin_ads": { sessions: 123, key_event_rate: 13.0 },
    "meta_ads": { sessions: 321, key_event_rate: 5.9, cpc: 0.90 },
    "direct": { sessions: 567, key_event_rate: 5.6 },
    "organic": { sessions: 308, key_event_rate: 6.2 },
  },
};

export const DEFAULT_SITE_URL = "https://www.go-rove.com";

export const KEY_PAGES = [
  "/",
  "/free-trial/",
  "/book-a-demo/",
  "/pricing/",
  "/about-us/",
  "/case-study/",
  "/roi-calculator/",
  "/partners/chamber-international/",
  "/blog/",
  "/webinars/",
];

export const STORAGE_KEY = "rove_cro_engine";
export const API_KEY_STORAGE = "rove_cro_api_key";
export const MODEL = "claude-sonnet-4-20250514";
