"""
CRO experiment runner. Equivalent of running train.py in the ML loop.

Serves the local site/, runs all evaluations, prints the composite score.
The CRO agent runs this after each modification to site/ files.

Usage:
    uv run run_cro.py              # Full evaluation (LLM + Lighthouse + Playwright)
    uv run run_cro.py --quick      # LLM-only (faster, for rapid iteration)
    uv run run_cro.py --no-llm     # Lighthouse + Playwright only (no API cost)
"""

import sys
import time
from pathlib import Path

from prepare_web import SITE_DIR, SERVE_PORT, SERVE_HOST, serve_site
from evaluate_web import (
    evaluate_all, evaluate_lighthouse, evaluate_journeys,
    evaluate_llm_judge, print_results, EvalResult, EVAL_PAGES,
    W_LLM, W_LIGHTHOUSE, W_PLAYWRIGHT,
)


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Run CRO evaluation on local site")
    parser.add_argument("--quick", action="store_true",
                        help="LLM-only evaluation (faster, no Lighthouse/Playwright)")
    parser.add_argument("--no-llm", action="store_true",
                        help="Skip LLM evaluation (no API cost)")
    args = parser.parse_args()

    # Verify site exists
    if not SITE_DIR.exists():
        print("Error: site/ directory not found. Run `uv run prepare_web.py` first.")
        sys.exit(1)

    html_files = list(SITE_DIR.rglob("*.html"))
    if len(html_files) < 3:
        print(f"Error: site/ has only {len(html_files)} HTML files. Looks incomplete.")
        sys.exit(1)

    # Start local server
    print(f"Starting local server on {SERVE_HOST}:{SERVE_PORT}...")
    server = serve_site(SERVE_PORT)
    base_url = f"http://{SERVE_HOST}:{SERVE_PORT}"

    t_start = time.time()

    try:
        if args.quick:
            # LLM-only mode for rapid iteration
            print("\n=== QUICK MODE: LLM Judge Only ===\n")
            result = EvalResult()
            result.pages_evaluated = len(EVAL_PAGES)

            llm_scores = []
            for page_path, page_name in EVAL_PAGES:
                html_candidates = [
                    SITE_DIR / page_path.strip("/") / "index.html",
                    SITE_DIR / (page_path.strip("/") + ".html"),
                ]
                if page_path == "/":
                    html_candidates = [SITE_DIR / "index.html"]

                page_html = ""
                for candidate in html_candidates:
                    if candidate.exists():
                        page_html = candidate.read_text(errors="replace")
                        break

                print(f"  Evaluating {page_name}...")
                scores = evaluate_llm_judge(page_html, page_path, page_name)
                llm_scores.append(scores)
                print(f"    → avg={scores.average:.1f}")

            n = len(llm_scores)
            result.llm_judge_avg = sum(s.average for s in llm_scores) / n
            result.clarity_avg = sum(s.clarity for s in llm_scores) / n
            result.urgency_avg = sum(s.urgency for s in llm_scores) / n
            result.trust_avg = sum(s.trust for s in llm_scores) / n
            result.friction_avg = sum(s.friction for s in llm_scores) / n
            result.mobile_avg = sum(s.mobile_readiness for s in llm_scores) / n
            # In quick mode, composite = LLM only
            result.composite_cro = result.llm_judge_avg

        elif args.no_llm:
            # Lighthouse + Playwright only
            print("\n=== NO-LLM MODE: Lighthouse + Playwright Only ===\n")
            result = EvalResult()
            result.pages_evaluated = len(EVAL_PAGES)

            lh_scores = []
            for page_path, page_name in EVAL_PAGES:
                full_url = f"{base_url}{page_path}"
                print(f"  Lighthouse: {page_name}...")
                lh = evaluate_lighthouse(full_url)
                lh_scores.append(lh)
                print(f"    → Perf={lh.performance}, A11y={lh.accessibility}")

            n = len(lh_scores)
            result.lighthouse_perf = sum(s.performance for s in lh_scores) / n
            result.lighthouse_a11y = sum(s.accessibility for s in lh_scores) / n
            result.lighthouse_seo = sum(s.seo for s in lh_scores) / n
            result.lighthouse_avg = sum(s.normalised for s in lh_scores) / n
            result.lcp_ms = sum(s.lcp_ms for s in lh_scores) / n
            result.cls = sum(s.cls for s in lh_scores) / n

            print(f"\n  Playwright journeys...")
            journey = evaluate_journeys(base_url)
            result.journey_avg = journey.average

            # Reweight without LLM
            total_w = W_LIGHTHOUSE + W_PLAYWRIGHT
            result.composite_cro = (
                (W_LIGHTHOUSE / total_w) * result.lighthouse_avg +
                (W_PLAYWRIGHT / total_w) * result.journey_avg
            )

        else:
            # Full evaluation
            print("\n=== FULL CRO EVALUATION ===\n")
            result = evaluate_all(base_url, SITE_DIR)

    finally:
        server.shutdown()

    t_end = time.time()

    # Print results in grep-friendly format
    print(f"\n")
    print_results(result)
    print(f"eval_seconds:     {t_end - t_start:.1f}")
    print(f"mode:             {'quick' if args.quick else 'no-llm' if args.no_llm else 'full'}")


if __name__ == "__main__":
    main()
