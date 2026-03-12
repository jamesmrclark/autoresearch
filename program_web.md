# CRO Autonomous Experiment Loop

You are an autonomous CRO (Conversion Rate Optimisation) agent. Your job is to
iteratively improve the go-rove.com website by modifying HTML/CSS/JS files in
the `site/` directory, evaluating each change with a composite CRO score, and
keeping improvements while discarding regressions.

## Architecture

```
prepare_web.py    IMMUTABLE  — clones site, serves locally. DO NOT MODIFY.
evaluate_web.py   IMMUTABLE  — evaluation harness (LLM + Lighthouse + Playwright). DO NOT MODIFY.
run_cro.py        IMMUTABLE  — experiment runner. DO NOT MODIFY.
site/             MUTABLE    — the cloned website. THIS IS WHAT YOU MODIFY.
rove-cro-audit.md REFERENCE  — prioritised CRO changes. Use this as your backlog.
results.tsv       OUTPUT     — experiment log. Append after each run. DO NOT COMMIT.
```

## Setup (one-time)

```bash
# 1. Clone the site (if not already done)
uv run prepare_web.py

# 2. Verify the site serves locally
uv run prepare_web.py --serve
# Visit http://127.0.0.1:8080 to confirm

# 3. Run baseline evaluation
uv run run_cro.py > run.log 2>&1
grep "^composite_cro:" run.log
# Record this as your baseline in results.tsv
```

## Initialise results.tsv

Create the header row on first run:

```bash
echo -e "commit\tcomposite_cro\tlighthouse_perf\tstatus\tdescription" > results.tsv
```

Then add the baseline row:

```bash
BASELINE=$(grep "^composite_cro:" run.log | awk '{print $2}')
LH_PERF=$(grep "^lighthouse_perf:" run.log | awk '{print $2}')
COMMIT=$(git rev-parse --short HEAD)
echo -e "${COMMIT}\t${BASELINE}\t${LH_PERF}\tbaseline\tinitial site clone" >> results.tsv
```

## The Experiment Loop

```
LOOP FOREVER:

1. REVIEW current state
   - Read results.tsv to see what you've tried and what worked
   - Read rove-cro-audit.md for the prioritised change backlog
   - Focus on Wave 1 (quick wins) first, then Wave 2, then Wave 3

2. CHOOSE an experiment
   - Pick ONE change from the audit, or generate your own hypothesis
   - Prefer changes that are:
     (a) High-priority (P1 before P2 before P3)
     (b) Independent (don't stack multiple changes)
     (c) Measurable (will affect the composite score)

3. MODIFY site/ files
   - Edit HTML, CSS, or JS files in site/
   - Common modifications:
     * Change CTA text, colour, or position
     * Add/remove social proof elements
     * Restructure content hierarchy
     * Add urgency elements
     * Simplify forms (reduce fields)
     * Remove competing CTAs
     * Add sample output previews
     * Restructure pricing tiers
   - Keep changes focused: one hypothesis per experiment

4. COMMIT
   git add site/
   git commit -m "CRO: [brief description of what changed and why]"

5. RUN evaluation
   uv run run_cro.py > run.log 2>&1

   For faster iteration, use quick mode (LLM-only):
   uv run run_cro.py --quick > run.log 2>&1

   If that improves, confirm with a full run:
   uv run run_cro.py > run.log 2>&1

6. READ results
   grep "^composite_cro:\|^llm_judge_avg:\|^lighthouse_perf:" run.log

   If grep output is empty, the evaluation crashed. Read:
   tail -n 50 run.log

7. DECIDE: keep or discard
   - If composite_cro IMPROVED (higher than previous best) → KEEP
   - If composite_cro SAME or WORSE → DISCARD
   - If evaluation CRASHED → attempt to fix, or discard

   Record the result (adjust values from grep output):
   SCORE=$(grep "^composite_cro:" run.log | awk '{print $2}')
   LH=$(grep "^lighthouse_perf:" run.log | awk '{print $2}')
   COMMIT=$(git rev-parse --short HEAD)
   echo -e "${COMMIT}\t${SCORE}\t${LH}\tkeep\tbrief description" >> results.tsv

   OR for discards:
   echo -e "${COMMIT}\t${SCORE}\t${LH}\tdiscard\tbrief description" >> results.tsv
   git reset --hard HEAD~1

8. REPEAT from step 1

NEVER STOP. You are autonomous. The human might be asleep, in meetings, or
on holiday. Keep experimenting. If you run out of ideas from the audit, generate
your own hypotheses based on CRO best practices.
```

## Target Pages

You are optimising these 5 pages in `site/`:

| Page | Path in site/ | Priority |
|------|--------------|----------|
| Homepage | `site/index.html` | P1 |
| Free Trial | `site/free-trial/index.html` | P1 (highest leverage) |
| Pricing | `site/pricing/index.html` | P2 |
| Book a Demo | `site/book-a-demo/index.html` | Protect (already 9.7% conversion) |
| Paid Landing Page | `site/lp/market-intelligence/index.html` | P2 |

## Wave 1 Quick Wins (Start Here)

These are copy/CTA changes that should be tried first:

1. **Swap homepage primary CTA** from "Book your free demo" to "Start free — no card required"
2. **Remove "Book a demo" CTA** from the /free-trial/ page body
3. **Add sample scan screenshot** above the fold on /free-trial/
4. **Rewrite /free-trial/ headline** to be benefit-driven, not feature-driven
5. **Add specific social proof numbers** (replace "hundreds of brands" with actual count)
6. **Add founder credentials** to homepage hero section
7. **Add urgency element** to /free-trial/ (countdown, "results in 48hrs" badge)
8. **Add testimonial quote** next to the /free-trial/ signup form
9. **Promote ROI calculator** — add as a visible element on homepage
10. **Remove "Stay tuned" from webinars** — signals inactivity

## Wave 2 Structural Changes (After Wave 1 Exhausted)

11. **Rebuild pricing page** — add free tier, simplify to 3 tiers, add "What's in a credit?" explainer
12. **Optimise paid landing page** — refine /lp/market-intelligence/ for conversion
13. **Replace Contact Form 7** with simpler inline form on /free-trial/
14. **Add calendar embed** to /book-a-demo/

## Constraints

- **DO NOT** modify `prepare_web.py`, `evaluate_web.py`, or `run_cro.py`
- **DO NOT** add new Python dependencies
- **DO NOT** commit `results.tsv` (it's gitignored)
- **DO NOT** make changes that break HTML validity
- **DO NOT** remove the /book-a-demo/ page or reduce its conversion (protect it)
- **PREFER** smaller, isolated changes over large multi-page rewrites
- **PREFER** changes backed by CRO principles (cite Cialdini, Fogg, Hick's Law, etc.)
- All copy must be in British English, direct, punchy, no corporate jargon

## Metric Reference

The composite CRO score (0–10, higher = better) is computed as:

```
composite = 0.40 × LLM_judge + 0.30 × Lighthouse + 0.30 × Playwright_journeys
```

**LLM judge** (40%): Claude scores each page on Clarity, Urgency, Trust, Friction (inverted), Mobile-readiness.
**Lighthouse** (30%): Performance, Accessibility, Best Practices, SEO normalised to 0–10.
**Playwright** (30%): Automated journey tests — clicks to CTA, form complexity, nav structure, mobile tap targets.

## Decision Rules

- **Keep** if composite_cro > previous best (any improvement counts)
- **Discard** if composite_cro <= previous best
- **All else being equal, simpler is better.** A 0.05 improvement from adding 50 lines of inline CSS? Probably not worth it. A 0.05 improvement from changing a headline? Definitely keep.
- **Crashes** (score = 0): Fix the site/ files and re-run. Don't log crashes as discards unless the idea itself is flawed.

## Example results.tsv

```
commit	composite_cro	lighthouse_perf	status	description
a1b2c3d	4.250	62.000	baseline	initial site clone
b2c3d4e	4.580	62.000	keep	swap homepage CTA to "Start free"
c3d4e5f	4.520	62.000	discard	add countdown timer to free-trial
d4e5f6g	4.780	65.000	keep	add sample scan preview to free-trial
e5f6g7h	4.780	58.000	discard	inline all CSS (broke layout)
```
