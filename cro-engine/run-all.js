#!/usr/bin/env node
/**
 * CRO Engine — Run All
 *
 * End-to-end script: analyse pages → generate experiments → build variants
 * → score control & variant → apply changes to site HTML → output scorecard.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node run-all.js
 *
 * Outputs:
 *   - output/modified-pages/   — HTML files with variant changes applied
 *   - output/scorecard.json    — all scores
 *   - output/scorecard.html    — visual scorecard you can open in a browser
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_DIR = path.join(__dirname, "..", "site");
const OUTPUT_DIR = path.join(__dirname, "output");

// ── Config ───────────────────────────────────────────────────────────────────

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error("ERROR: Set ANTHROPIC_API_KEY environment variable.");
  process.exit(1);
}

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";
const MAX_CONCURRENT = 3;
const DELAY_MS = 2500;
let activeRequests = 0;
const queue = [];

const KEY_PAGES = [
  { path: "/", file: "index.html", name: "Homepage" },
  { path: "/free-trial/", file: "free-trial/index.html", name: "Free Trial" },
  { path: "/book-a-demo/", file: "book-a-demo/index.html", name: "Book a Demo" },
  { path: "/pricing/", file: "pricing/index.html", name: "Pricing" },
  { path: "/about-us/", file: "about-us/index.html", name: "About Us" },
];

const BASELINE_METRICS = {
  total_sessions: 1918,
  monthly_sessions: 824,
  sitewide_key_event_rate: 8.0,
  pages: {
    "/": { sessions: 633, key_event_rate: 8.2 },
    "/free-trial/": { sessions: 257, key_event_rate: 5.1 },
    "/book-a-demo/": { sessions: 113, key_event_rate: 9.7 },
    "/pricing/": { sessions: 30, key_event_rate: 33.3 },
    "/about-us/": { sessions: 58, key_event_rate: 0 },
  },
};

// ── API helpers ──────────────────────────────────────────────────────────────

function dequeue() {
  if (queue.length > 0 && activeRequests < MAX_CONCURRENT) {
    const next = queue.shift();
    next();
  }
}

async function callClaude(system, userContent, maxTokens = 4096) {
  return new Promise((resolve, reject) => {
    const execute = async () => {
      activeRequests++;
      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: MODEL,
            max_tokens: maxTokens,
            system,
            messages: [{ role: "user", content: userContent }],
          }),
        });
        if (!res.ok) {
          const err = await res.text();
          throw new Error(`API ${res.status}: ${err}`);
        }
        const data = await res.json();
        resolve(data.content?.[0]?.text || "");
      } catch (e) {
        reject(e);
      } finally {
        activeRequests--;
        setTimeout(dequeue, DELAY_MS);
      }
    };
    if (activeRequests < MAX_CONCURRENT) execute();
    else queue.push(execute);
  });
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
    if (m) return JSON.parse(m[1].trim());
    const m2 = text.match(/\[[\s\S]*\]/);
    if (m2) return JSON.parse(m2[0]);
    const m3 = text.match(/\{[\s\S]*\}/);
    if (m3) return JSON.parse(m3[0]);
    throw new Error("Could not parse JSON from response");
  }
}

// ── Prompts ──────────────────────────────────────────────────────────────────

const PAGE_ANALYSIS_SYSTEM = `You are a senior CRO analyst. Analyse the webpage HTML provided and return a JSON object with this structure. Be precise and data-driven.

Return ONLY valid JSON, no markdown:
{
  "url": string,
  "page_type": "homepage" | "landing_page" | "pricing" | "content" | "conversion" | "trust",
  "primary_cta": { "text": string, "destination": string, "above_fold": boolean },
  "value_proposition": { "headline": string, "clarity_score": 1-10, "urgency_score": 1-10 },
  "trust_signals": { "logos": number, "testimonials": number, "data_points": number },
  "friction_points": [string],
  "social_proof_score": 1-10,
  "conversion_barriers": [string],
  "opportunities": [string]
}

Context: Rove is a B2B SaaS — AI-powered international market intelligence for UK consumer brands. Freemium model. ICP: Scaling Sophie (Head of International), Homeware Harry (Commercial Director), Wellness Wendy (Founder/MD), Luxury Liam (Brand Director).`;

const EXPERIMENT_SYSTEM = `You are a CRO experiment designer. Given page analyses and baseline metrics, generate 5 prioritised A/B test experiments.

For each experiment return JSON:
{
  "experiment_id": "EXP-001",
  "page": string (URL path like "/" or "/free-trial/"),
  "hypothesis": "If we [change], then [metric] will [improve] by [estimate], because [reasoning]",
  "change_type": "copy" | "layout" | "cta" | "social_proof",
  "priority_score": 1-100,
  "estimated_lift": "+X% conversion",
  "variant_a": { "description": "Current state", "code_or_copy": "current HTML/copy" },
  "variant_b": { "description": "Proposed change", "code_or_copy": "new HTML/copy" },
  "wave": 1
}

Every experiment MUST cite a CRO principle (Cialdini, Fogg, Hick's Law, etc.).
Return a JSON array of exactly 5 experiments. Return ONLY valid JSON.`;

const VARIANT_BUILDER_SYSTEM = `You are a CRO variant builder. Given an experiment and the FULL page HTML, produce the complete modified page HTML with the variant change applied.

Return JSON:
{
  "experiment_id": string,
  "control_description": string,
  "variant_description": string,
  "changes": [{ "element": string, "before": string, "after": string }],
  "full_page_html": string (THE COMPLETE PAGE HTML WITH CHANGES APPLIED - this must be a full valid HTML document),
  "rationale": string
}

CRITICAL: "full_page_html" must be the ENTIRE page HTML with the variant change applied inline. Not a snippet — the full document.
All copy must be British English. Changes should be minimal and focused.
Return ONLY valid JSON, no markdown.`;

const LLM_JUDGE_SYSTEM = `You are a senior CRO analyst. Score this page on 5 dimensions, each 1-10.

Website: Rove (go-rove.com) — AI market intelligence for UK consumer brands.
Primary goal: free trial signups. Secondary: demo bookings.

Dimensions:
1. CLARITY (1-10): Value prop obvious within 5 seconds?
2. URGENCY (1-10): Reason to act now?
3. TRUST (1-10): Specific numbers, named customers, logos?
4. FRICTION (1-10, 10=low friction=GOOD): Easy path to conversion?
5. MOBILE_READINESS (1-10): Works on 375x812?

Respond in EXACTLY this JSON (no markdown):
{"clarity": 7, "urgency": 3, "trust": 5, "friction": 6, "mobile_readiness": 5, "notes": "Brief explanation"}`;

// ── Main pipeline ────────────────────────────────────────────────────────────

async function main() {
  console.log("\n=== CRO Engine — Run All ===\n");

  // Ensure output dirs
  fs.mkdirSync(path.join(OUTPUT_DIR, "modified-pages"), { recursive: true });

  // Step 1: Load site HTML
  console.log("Step 1: Loading site pages...");
  const pages = [];
  for (const p of KEY_PAGES) {
    const filePath = path.join(SITE_DIR, p.file);
    if (fs.existsSync(filePath)) {
      const html = fs.readFileSync(filePath, "utf-8");
      pages.push({ ...p, html });
      console.log(`  ✓ ${p.name} (${(html.length / 1024).toFixed(0)}KB)`);
    } else {
      console.log(`  ✗ ${p.name} — file not found: ${filePath}`);
    }
  }

  if (pages.length === 0) {
    console.error("No pages found. Ensure site/ directory has HTML files.");
    process.exit(1);
  }

  // Step 2: Analyse pages (in parallel)
  console.log("\nStep 2: Analysing pages with Claude...");
  const analyses = await Promise.all(
    pages.map(async (p) => {
      const truncated = p.html.slice(0, 30000);
      const resp = await callClaude(PAGE_ANALYSIS_SYSTEM, `URL: ${p.path}\n\n${truncated}`, 4096);
      const analysis = parseJson(resp);
      console.log(`  ✓ ${p.name} — ${analysis.page_type}, clarity: ${analysis.value_proposition?.clarity_score}/10`);
      return { ...analysis, url: p.path };
    })
  );

  // Step 3: Generate experiments
  console.log("\nStep 3: Generating experiments...");
  const context = JSON.stringify({ analyses, baseline_metrics: BASELINE_METRICS });
  const expResp = await callClaude(EXPERIMENT_SYSTEM, context, 8192);
  const experiments = parseJson(expResp);
  console.log(`  ✓ Generated ${experiments.length} experiments`);
  for (const exp of experiments) {
    console.log(`    ${exp.experiment_id}: ${exp.page} — ${exp.hypothesis.slice(0, 80)}...`);
  }

  // Step 4: Build variants + Score (for each experiment)
  console.log("\nStep 4: Building variants, scoring, and applying changes...");
  const results = [];

  for (const exp of experiments) {
    console.log(`\n  --- ${exp.experiment_id} (${exp.page}) ---`);

    // Find the page HTML
    const page = pages.find((p) => p.path === exp.page || exp.page.includes(p.path.replace(/\/$/, "")));
    if (!page) {
      console.log(`    ✗ No HTML found for ${exp.page}, skipping`);
      continue;
    }

    // Build variant (pass full page HTML so Claude can modify it)
    console.log(`    Building variant...`);
    let variant;
    try {
      const buildContext = JSON.stringify({ experiment: exp, page_html: page.html.slice(0, 60000) });
      const vResp = await callClaude(VARIANT_BUILDER_SYSTEM, buildContext, 16384);
      variant = parseJson(vResp);
      console.log(`    ✓ Variant built: ${variant.changes?.length || 0} changes`);
    } catch (e) {
      console.log(`    ✗ Variant build failed: ${e.message}`);
      continue;
    }

    // Score control
    console.log(`    Scoring control...`);
    let controlScores;
    try {
      const cResp = await callClaude(LLM_JUDGE_SYSTEM, `Page: ${page.name} (control)\n\nHTML:\n${page.html.slice(0, 15000)}`, 500);
      controlScores = parseJson(cResp);
      controlScores.average = ((controlScores.clarity + controlScores.urgency + controlScores.trust + controlScores.friction + controlScores.mobile_readiness) / 5).toFixed(1);
      console.log(`    ✓ Control score: ${controlScores.average}/10`);
    } catch (e) {
      console.log(`    ✗ Control scoring failed: ${e.message}`);
      controlScores = { clarity: 0, urgency: 0, trust: 0, friction: 0, mobile_readiness: 0, average: "0", notes: "Scoring failed" };
    }

    // Score variant
    console.log(`    Scoring variant...`);
    let variantScores;
    try {
      const variantHtml = variant.full_page_html || variant.full_variant_snippet || page.html;
      const vResp = await callClaude(LLM_JUDGE_SYSTEM, `Page: ${page.name} (variant)\n\nHTML:\n${variantHtml.slice(0, 15000)}`, 500);
      variantScores = parseJson(vResp);
      variantScores.average = ((variantScores.clarity + variantScores.urgency + variantScores.trust + variantScores.friction + variantScores.mobile_readiness) / 5).toFixed(1);
      console.log(`    ✓ Variant score: ${variantScores.average}/10`);
    } catch (e) {
      console.log(`    ✗ Variant scoring failed: ${e.message}`);
      variantScores = { clarity: 0, urgency: 0, trust: 0, friction: 0, mobile_readiness: 0, average: "0", notes: "Scoring failed" };
    }

    // Save modified page HTML
    const modifiedHtml = variant.full_page_html || variant.full_variant_snippet || page.html;
    const safeName = exp.experiment_id.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const outFile = path.join(OUTPUT_DIR, "modified-pages", `${safeName}-${page.name.toLowerCase().replace(/\s+/g, "-")}.html`);
    fs.writeFileSync(outFile, modifiedHtml, "utf-8");
    console.log(`    ✓ Saved: ${outFile}`);

    const delta = (parseFloat(variantScores.average) - parseFloat(controlScores.average)).toFixed(1);
    console.log(`    ⇒ Score delta: ${delta > 0 ? "+" : ""}${delta}`);

    results.push({
      experiment_id: exp.experiment_id,
      page: exp.page,
      page_name: page.name,
      hypothesis: exp.hypothesis,
      change_type: exp.change_type,
      changes: variant.changes || [],
      controlScores,
      variantScores,
      delta: parseFloat(delta),
      outputFile: outFile,
    });
  }

  // Step 5: Save scorecard JSON
  console.log("\n\nStep 5: Generating scorecard...");
  const scorecard = {
    generated_at: new Date().toISOString(),
    experiments_scored: results.length,
    results,
    aggregate: {
      avg_control: (results.reduce((s, r) => s + parseFloat(r.controlScores.average), 0) / results.length).toFixed(1),
      avg_variant: (results.reduce((s, r) => s + parseFloat(r.variantScores.average), 0) / results.length).toFixed(1),
      avg_delta: (results.reduce((s, r) => s + r.delta, 0) / results.length).toFixed(1),
    },
  };

  fs.writeFileSync(path.join(OUTPUT_DIR, "scorecard.json"), JSON.stringify(scorecard, null, 2));
  console.log(`  ✓ Saved scorecard.json`);

  // Step 6: Generate visual HTML scorecard
  const scorecardHtml = generateScorecardHtml(scorecard);
  fs.writeFileSync(path.join(OUTPUT_DIR, "scorecard.html"), scorecardHtml);
  console.log(`  ✓ Saved scorecard.html — open this file in a browser to see results`);

  // Print summary
  console.log("\n\n========================================");
  console.log("           SCORECARD SUMMARY");
  console.log("========================================\n");
  console.log(`  Experiments scored: ${results.length}`);
  console.log(`  Avg Control Score:  ${scorecard.aggregate.avg_control}/10`);
  console.log(`  Avg Variant Score:  ${scorecard.aggregate.avg_variant}/10`);
  console.log(`  Avg Improvement:    ${scorecard.aggregate.avg_delta > 0 ? "+" : ""}${scorecard.aggregate.avg_delta}\n`);

  console.log("  Per-experiment:");
  for (const r of results) {
    const arrow = r.delta > 0 ? "↑" : r.delta < 0 ? "↓" : "→";
    console.log(`    ${r.experiment_id} (${r.page_name}): ${r.controlScores.average} → ${r.variantScores.average} ${arrow} ${r.delta > 0 ? "+" : ""}${r.delta}`);
  }

  console.log("\n  Output files:");
  console.log(`    ${path.join(OUTPUT_DIR, "scorecard.html")} — visual scorecard`);
  console.log(`    ${path.join(OUTPUT_DIR, "scorecard.json")} — raw data`);
  for (const r of results) {
    console.log(`    ${r.outputFile}`);
  }
  console.log("\n  Open scorecard.html in a browser to see the full visual report.\n");
}

// ── HTML scorecard generator ─────────────────────────────────────────────────

function generateScorecardHtml(scorecard) {
  const dims = ["clarity", "urgency", "trust", "friction", "mobile_readiness"];
  const dimLabels = { clarity: "Clarity", urgency: "Urgency", trust: "Trust", friction: "Friction", mobile_readiness: "Mobile" };

  const experimentCards = scorecard.results.map((r) => {
    const bars = dims.map((d) => {
      const c = r.controlScores[d] || 0;
      const v = r.variantScores[d] || 0;
      const delta = (v - c).toFixed(1);
      const color = v > c ? "#10b981" : v < c ? "#ef4444" : "#94a3b8";
      return `
        <div style="display:flex;align-items:center;gap:8px;margin:4px 0">
          <span style="width:70px;font-size:11px;color:#64748b">${dimLabels[d]}</span>
          <div style="flex:1;display:flex;gap:4px">
            <div style="flex:1;background:#e2e8f0;border-radius:3px;height:18px;position:relative">
              <div style="width:${c * 10}%;background:#94a3b8;height:100%;border-radius:3px"></div>
              <span style="position:absolute;left:4px;top:1px;font-size:10px;font-weight:600">${c}</span>
            </div>
            <div style="flex:1;background:#e2e8f0;border-radius:3px;height:18px;position:relative">
              <div style="width:${v * 10}%;background:${color};height:100%;border-radius:3px"></div>
              <span style="position:absolute;left:4px;top:1px;font-size:10px;font-weight:600">${v}</span>
            </div>
          </div>
          <span style="width:40px;text-align:right;font-size:11px;font-weight:600;color:${color}">${delta > 0 ? "+" : ""}${delta}</span>
        </div>`;
    }).join("");

    const changesList = (r.changes || []).map((c) =>
      `<div style="font-size:11px;margin:2px 0;display:grid;grid-template-columns:100px 1fr 1fr;gap:4px">
        <span style="color:#64748b;font-family:monospace;overflow:hidden;text-overflow:ellipsis">${c.element || ""}</span>
        <span style="background:#fef2f2;color:#b91c1c;padding:1px 4px;border-radius:2px;overflow:hidden;text-overflow:ellipsis">${c.before || ""}</span>
        <span style="background:#f0fdf4;color:#166534;padding:1px 4px;border-radius:2px;overflow:hidden;text-overflow:ellipsis">${c.after || ""}</span>
      </div>`
    ).join("");

    const fileName = path.basename(r.outputFile || "");

    return `
      <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;margin:16px 0;overflow:hidden">
        <div style="padding:16px;border-bottom:1px solid #f1f5f9">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <span style="font-size:12px;font-family:monospace;color:#94a3b8">${r.experiment_id}</span>
              <span style="font-size:12px;color:#64748b;margin-left:8px">${r.page_name}</span>
              <span style="font-size:12px;font-weight:600;margin-left:8px;color:${r.delta > 0 ? "#059669" : r.delta < 0 ? "#dc2626" : "#64748b"}">${r.delta > 0 ? "+" : ""}${r.delta} avg</span>
            </div>
            <a href="modified-pages/${fileName}" style="font-size:11px;color:#2563eb;text-decoration:none">View Modified Page →</a>
          </div>
          <p style="font-size:13px;color:#1e293b;margin-top:6px">${r.hypothesis}</p>
        </div>
        <div style="padding:16px">
          <div style="display:flex;gap:4px;margin-bottom:8px">
            <span style="font-size:10px;color:#94a3b8;display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;background:#94a3b8;border-radius:2px;display:inline-block"></span>Control</span>
            <span style="font-size:10px;color:#94a3b8;display:flex;align-items:center;gap:4px;margin-left:8px"><span style="width:10px;height:10px;background:#10b981;border-radius:2px;display:inline-block"></span>Variant</span>
          </div>
          ${bars}
        </div>
        ${changesList ? `<div style="padding:12px 16px;border-top:1px solid #f1f5f9"><div style="font-size:11px;font-weight:600;color:#64748b;margin-bottom:4px">Changes</div>${changesList}</div>` : ""}
      </div>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>CRO Scorecard — Rove</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; padding: 32px; max-width: 900px; margin: 0 auto; }
  </style>
</head>
<body>
  <h1 style="font-size:24px;font-weight:700;margin-bottom:4px">CRO Scorecard</h1>
  <p style="font-size:13px;color:#64748b;margin-bottom:24px">Generated ${new Date().toLocaleDateString("en-GB")} — ${scorecard.experiments_scored} experiments scored</p>

  <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:24px">
    <h2 style="font-size:14px;font-weight:600;margin-bottom:12px">Aggregate</h2>
    <div style="display:flex;gap:32px">
      <div>
        <div style="font-size:11px;color:#64748b">Control Avg</div>
        <div style="font-size:28px;font-weight:700">${scorecard.aggregate.avg_control}</div>
      </div>
      <div style="font-size:28px;color:#94a3b8;display:flex;align-items:center">→</div>
      <div>
        <div style="font-size:11px;color:#64748b">Variant Avg</div>
        <div style="font-size:28px;font-weight:700;color:${parseFloat(scorecard.aggregate.avg_delta) > 0 ? "#059669" : "#dc2626"}">${scorecard.aggregate.avg_variant}</div>
      </div>
      <div>
        <div style="font-size:11px;color:#64748b">Improvement</div>
        <div style="font-size:28px;font-weight:700;color:${parseFloat(scorecard.aggregate.avg_delta) > 0 ? "#059669" : "#dc2626"}">${parseFloat(scorecard.aggregate.avg_delta) > 0 ? "+" : ""}${scorecard.aggregate.avg_delta}</div>
      </div>
    </div>
  </div>

  ${experimentCards}

  <p style="font-size:11px;color:#94a3b8;margin-top:24px;text-align:center">Click "View Modified Page" on each experiment to see the variant HTML applied to the full page.</p>
</body>
</html>`;
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
