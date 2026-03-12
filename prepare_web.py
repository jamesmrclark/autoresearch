"""
One-time setup for CRO experiments. Downloads (mirrors) the go-rove.com
website to a local `site/` directory and provides a local HTTP server for
evaluation. This file is IMMUTABLE — the CRO agent must never modify it.

Usage:
    uv run prepare_web.py          # Clone site + create skeleton pages
    uv run prepare_web.py --serve  # Start local server on port 8080
"""

import os
import sys
import shutil
import subprocess
import http.server
import threading
import time
from pathlib import Path

# ── Constants ──────────────────────────────────────────────────────────────────

SITE_DIR = Path(__file__).parent / "site"
SITE_URL = "https://go-rove.com"
SERVE_PORT = 8080
SERVE_HOST = "127.0.0.1"

# Pages to mirror (wget will follow links, but these ensure coverage)
TARGET_PAGES = [
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
]

# Chrome binary — try several locations
CHROME_CANDIDATES = [
    os.environ.get("CHROME_PATH", ""),
    "/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    shutil.which("chromium-browser") or "",
    shutil.which("chromium") or "",
    shutil.which("google-chrome") or "",
]


def find_chrome() -> str:
    """Find a working Chrome/Chromium binary."""
    for candidate in CHROME_CANDIDATES:
        if candidate and os.path.isfile(candidate):
            return candidate
    raise FileNotFoundError(
        "No Chrome/Chromium binary found. Install Chromium or set CHROME_PATH."
    )


# ── Site Cloning ───────────────────────────────────────────────────────────────

def clone_site(force: bool = False) -> Path:
    """
    Mirror go-rove.com into site/ using wget. Idempotent — skips if site/
    already exists unless force=True.
    """
    if SITE_DIR.exists() and not force:
        page_count = len(list(SITE_DIR.rglob("*.html")))
        if page_count >= 5:
            print(f"site/ already exists with {page_count} HTML files. Skipping clone.")
            print("  (Use --force to re-download)")
            return SITE_DIR

    print(f"Cloning {SITE_URL} into {SITE_DIR}/ ...")

    # Remove stale clone
    if SITE_DIR.exists():
        shutil.rmtree(SITE_DIR)

    # wget mirror into a temp directory, then move
    tmp_dir = SITE_DIR.parent / "_site_tmp"
    if tmp_dir.exists():
        shutil.rmtree(tmp_dir)
    tmp_dir.mkdir()

    wget_cmd = [
        "wget",
        "--mirror",
        "--convert-links",
        "--adjust-extension",
        "--page-requisites",
        "--no-parent",
        "--no-host-directories",
        "--directory-prefix", str(tmp_dir),
        "--timeout=30",
        "--tries=3",
        "--wait=0.5",
        "--reject", "*.woff2,*.woff,*.ttf,*.eot",  # Skip fonts (large, not needed for eval)
        "--execute", "robots=off",
        SITE_URL + "/",
    ]

    print(f"  Running: {' '.join(wget_cmd[:6])} ...")
    result = subprocess.run(
        wget_cmd,
        capture_output=True,
        text=True,
        timeout=600,  # 10 min max
    )

    # wget returns 8 for some 404s even on success — check we got files
    html_files = list(tmp_dir.rglob("*.html"))
    if not html_files:
        print(f"  wget stderr: {result.stderr[-500:]}")
        raise RuntimeError("wget produced no HTML files. Check network access.")

    tmp_dir.rename(SITE_DIR)
    print(f"  Cloned {len(html_files)} HTML files into site/")

    # Ensure key pages exist (wget may miss some)
    _ensure_key_pages()
    _create_landing_page()

    return SITE_DIR


def _ensure_key_pages():
    """Check that key pages exist; create placeholder if wget missed them."""
    for page_path in TARGET_PAGES:
        # wget saves /free-trial/ as free-trial/index.html or free-trial.html
        candidates = [
            SITE_DIR / page_path.strip("/") / "index.html",
            SITE_DIR / (page_path.strip("/") + ".html"),
        ]
        if page_path == "/":
            candidates = [SITE_DIR / "index.html"]

        if not any(c.exists() for c in candidates):
            print(f"  Warning: {page_path} not found in clone. Creating placeholder.")
            target = candidates[0]
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(
                f'<!DOCTYPE html><html><head><title>Rove - {page_path}</title></head>'
                f'<body><h1>Placeholder for {page_path}</h1>'
                f'<p>wget did not capture this page. Replace with actual content.</p>'
                f'</body></html>'
            )


def _create_landing_page():
    """
    Create skeleton paid landing page at /lp/market-intelligence/.
    This is a NEW page from the CRO audit (H7) — doesn't exist on the live site.
    """
    lp_dir = SITE_DIR / "lp" / "market-intelligence"
    lp_dir.mkdir(parents=True, exist_ok=True)
    lp_file = lp_dir / "index.html"

    if lp_file.exists():
        return

    # Read homepage to extract styles/head content
    homepage = SITE_DIR / "index.html"
    head_content = ""
    if homepage.exists():
        content = homepage.read_text(errors="replace")
        # Extract <head> content for consistent styling
        import re
        head_match = re.search(r"<head>(.*?)</head>", content, re.DOTALL)
        if head_match:
            head_content = head_match.group(1)

    lp_file.write_text(f"""<!DOCTYPE html>
<html lang="en">
<head>
{head_content if head_content else '<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'}
<title>AI Market Intelligence for UK Brands | Rove</title>
</head>
<body>
<!-- PAID LANDING PAGE — No main site navigation. Single CTA. -->
<!-- This page is for Google Ads traffic (message-matched to HSA headlines) -->

<main style="max-width: 720px; margin: 0 auto; padding: 2rem; font-family: system-ui, sans-serif;">

    <h1>Score 27 global markets in 48 hours — free</h1>
    <p style="font-size: 1.25rem; color: #555;">
        Get verified market intelligence, regulatory checks, and channel partner
        access. No consultants. No guesswork.
    </p>

    <ul>
        <li>Market size, competition &amp; demand signals across 27 territories</li>
        <li>Regulatory &amp; compliance checks per market</li>
        <li>Direct introductions to verified channel partners</li>
        <li>Results delivered in 48 hours — not 48 days</li>
    </ul>

    <!-- TRUST SIGNALS -->
    <p><strong>Built by the team behind Smoothskin ($150M, 70 markets) and CAT Phones ($85M, 60 countries).</strong></p>

    <!-- SINGLE CTA FORM -->
    <form id="lp-signup-form" style="margin-top: 2rem;">
        <label for="email" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
            Get your free market scan:
        </label>
        <input type="email" id="email" name="email" placeholder="work@company.com"
               required style="padding: 0.75rem; width: 100%; max-width: 400px; font-size: 1rem; border: 2px solid #0072e5; border-radius: 4px;">
        <button type="submit" style="display: block; margin-top: 1rem; padding: 0.75rem 2rem; background: #FF5964; color: white; border: none; border-radius: 4px; font-size: 1.1rem; font-weight: 600; cursor: pointer;">
            Start free — no card required
        </button>
        <p style="font-size: 0.85rem; color: #777; margin-top: 0.5rem;">
            Free scan of one market. No credit card. Results in 48 hours.
        </p>
    </form>

    <!-- SOCIAL PROOF -->
    <blockquote style="margin-top: 2rem; padding: 1rem; background: #f5f7fa; border-left: 4px solid #0072e5; border-radius: 4px;">
        "Rove aligned perfectly with the problems small businesses face when
        operating in multiple markets without large budgets or large teams."
        <br><strong>— Alex Pitt, Commercial Director, de Faire Medical</strong>
    </blockquote>

</main>

</body>
</html>
""")
    print("  Created /lp/market-intelligence/ landing page skeleton")


# ── Local Server ───────────────────────────────────────────────────────────────

class _QuietHandler(http.server.SimpleHTTPRequestHandler):
    """Serve from site/ without logging every request."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SITE_DIR), **kwargs)

    def log_message(self, format, *args):
        pass  # Suppress request logs


def serve_site(port: int = SERVE_PORT) -> subprocess.Popen:
    """
    Start a local HTTP server serving site/ on the given port.
    Returns the server thread. Call server.shutdown() to stop.
    """
    server = http.server.HTTPServer((SERVE_HOST, port), _QuietHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    # Wait for server to be ready
    time.sleep(0.5)
    return server


# ── CLI ────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Prepare CRO experiment site")
    parser.add_argument("--force", action="store_true", help="Force re-download")
    parser.add_argument("--serve", action="store_true", help="Start local server")
    args = parser.parse_args()

    # Always ensure site exists
    clone_site(force=args.force)

    if args.serve:
        server = serve_site()
        print(f"\nServing site/ at http://{SERVE_HOST}:{SERVE_PORT}")
        print("Press Ctrl+C to stop.\n")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            server.shutdown()
            print("\nServer stopped.")
