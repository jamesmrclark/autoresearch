"""
CRO evaluation harness. Three independent scoring methods combined into a
single composite metric. This file is IMMUTABLE — the CRO agent must never
modify it.

Evaluation stack:
  1. LLM-as-judge  (40% weight) — Claude scores pages on 5 CRO dimensions
  2. Lighthouse     (30% weight) — Performance, accessibility, SEO, best practices
  3. Playwright     (30% weight) — Automated user journey tests

Composite CRO score: 0–10 scale, higher is better.
"""

import json
import os
import re
import subprocess
import tempfile
from dataclasses import dataclass, field
from pathlib import Path

# ── Configuration ──────────────────────────────────────────────────────────────

# Pages to evaluate (relative paths)
EVAL_PAGES = [
    ("/", "Homepage"),
    ("/free-trial/", "Free Trial"),
    ("/pricing/", "Pricing"),
    ("/book-a-demo/", "Book a Demo"),
    ("/lp/market-intelligence/", "Paid Landing Page"),
]

# Weights for composite score
W_LLM = 0.40
W_LIGHTHOUSE = 0.30
W_PLAYWRIGHT = 0.30

# Chrome binary resolution — check env var, then common Playwright + system paths
def _find_chrome() -> str:
    # 1. Explicit env var
    env_path = os.environ.get("CHROME_PATH", "")
    if env_path and os.path.isfile(env_path):
        return env_path

    # 2. Playwright-installed Chromium (auto-detect version directory)
    import glob
    playwright_patterns = [
        # macOS
        os.path.expanduser("~/Library/Caches/ms-playwright/chromium-*/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"),
        os.path.expanduser("~/Library/Caches/ms-playwright/chromium-*/chrome-mac/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"),
        # Linux
        "/root/.cache/ms-playwright/chromium-*/chrome-linux/chrome",
        os.path.expanduser("~/.cache/ms-playwright/chromium-*/chrome-linux/chrome"),
    ]
    for pattern in playwright_patterns:
        matches = sorted(glob.glob(pattern), reverse=True)  # newest version first
        if matches:
            return matches[0]

    # 3. System Chrome
    system_paths = [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",  # macOS
        "/usr/bin/chromium-browser",
        "/usr/bin/chromium",
        "/usr/bin/google-chrome-stable",
        "/usr/bin/google-chrome",
    ]
    for p in system_paths:
        if os.path.isfile(p):
            return p

    # 4. shutil.which fallback
    import shutil
    for name in ["chromium", "chromium-browser", "google-chrome", "google-chrome-stable"]:
        found = shutil.which(name)
        if found:
            return found

    raise FileNotFoundError(
        "No Chrome/Chromium binary found. Either:\n"
        "  - Set CHROME_PATH=/path/to/chrome\n"
        "  - Run: playwright install chromium\n"
        "  - Install Google Chrome"
    )


# Keep a module-level list for Playwright launcher compatibility
CHROME_CANDIDATES = [
    os.environ.get("CHROME_PATH", ""),
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
]


# ── Data Classes ───────────────────────────────────────────────────────────────

@dataclass
class LLMScores:
    clarity: float = 0.0
    urgency: float = 0.0
    trust: float = 0.0
    friction: float = 0.0       # 10 = low friction (good), 1 = high friction (bad)
    mobile_readiness: float = 0.0
    notes: str = ""

    @property
    def average(self) -> float:
        return (self.clarity + self.urgency + self.trust +
                self.friction + self.mobile_readiness) / 5


@dataclass
class LighthouseScores:
    performance: float = 0.0    # 0–100
    accessibility: float = 0.0  # 0–100
    best_practices: float = 0.0 # 0–100
    seo: float = 0.0            # 0–100
    lcp_ms: float = 0.0
    cls: float = 0.0

    @property
    def normalised(self) -> float:
        """Normalise from 0–100 scale to 0–10 scale."""
        return (self.performance + self.accessibility +
                self.best_practices + self.seo) / 400 * 10


@dataclass
class JourneyScores:
    clicks_to_trial: float = 0.0        # 10 = 1 click, 0 = unreachable
    cta_above_fold: float = 0.0         # 10 or 0
    form_field_count: float = 0.0       # 10 = 1–3 fields, 0 = 10+ fields
    competing_ctas: float = 0.0         # 10 = single CTA, 0 = 4+ CTAs
    free_tier_visible: float = 0.0      # 10 or 0
    feature_overload: float = 0.0       # 10 = <10 features, 0 = 28+
    calendar_embed: float = 0.0         # 10 or 0
    nav_stripped: float = 0.0           # 10 or 0 (landing page only)
    mobile_tap_targets: float = 0.0     # 0–10 based on % compliant

    @property
    def average(self) -> float:
        scores = [
            self.clicks_to_trial, self.cta_above_fold, self.form_field_count,
            self.competing_ctas, self.free_tier_visible, self.feature_overload,
            self.calendar_embed, self.nav_stripped, self.mobile_tap_targets,
        ]
        return sum(scores) / len(scores)


@dataclass
class PageResult:
    url: str = ""
    name: str = ""
    llm: LLMScores = field(default_factory=LLMScores)
    lighthouse: LighthouseScores = field(default_factory=LighthouseScores)
    journey: JourneyScores = field(default_factory=JourneyScores)


@dataclass
class EvalResult:
    pages: list = field(default_factory=list)
    composite_cro: float = 0.0
    llm_judge_avg: float = 0.0
    lighthouse_avg: float = 0.0
    journey_avg: float = 0.0
    # Per-dimension averages
    clarity_avg: float = 0.0
    urgency_avg: float = 0.0
    trust_avg: float = 0.0
    friction_avg: float = 0.0
    mobile_avg: float = 0.0
    lighthouse_perf: float = 0.0
    lighthouse_a11y: float = 0.0
    lighthouse_seo: float = 0.0
    lcp_ms: float = 0.0
    cls: float = 0.0
    pages_evaluated: int = 0


# ── 1. LLM-as-Judge ───────────────────────────────────────────────────────────

LLM_JUDGE_PROMPT = """You are a senior CRO (Conversion Rate Optimisation) analyst evaluating a B2B SaaS
freemium website page. Score this page on 5 dimensions, each from 1 to 10.

The website is Rove (go-rove.com) — an AI-powered international market intelligence
platform for UK consumer brands. The primary conversion goal is getting visitors to
sign up for a free trial (free market scan). The secondary goal is demo bookings.

ICP personas:
- Scaling Sophie: Head of International at £5–50M UK consumer brand
- Homeware Harry: Commercial Director at homeware/lifestyle brand
- Wellness Wendy: Founder/MD of wellness/beauty brand
- Luxury Liam: Brand Director at premium/luxury brand

Page being evaluated: {page_name} ({page_url})

Score on these dimensions:

1. CLARITY (1–10): Is the value proposition immediately obvious? Could a visitor
   understand what this page offers within 5 seconds? Is the headline specific
   and benefit-driven?

2. URGENCY (1–10): Is there a compelling reason to act NOW rather than later?
   Are there time-limited offers, social proof momentum, scarcity signals, or
   loss-aversion triggers?

3. TRUST (1–10): Are there specific numbers (not vague claims like "hundreds"),
   named customers with titles, recognisable logos, third-party validations,
   security badges, or founder credentials?

4. FRICTION (1–10, where 10 = very low friction = GOOD): How easy is the path to
   conversion? Score HIGH if: single clear CTA, minimal form fields, no competing
   asks, no confusing navigation away from conversion. Score LOW if: multiple
   competing CTAs, long forms, unclear next steps, too many choices.

5. MOBILE_READINESS (1–10): Would this page work well on a 375×812 mobile screen?
   Are tap targets large enough? Is text readable without zooming? Are images
   optimised? Is the CTA visible without excessive scrolling?

IMPORTANT: Base scores on established CRO principles (Cialdini, Fogg Behaviour Model,
Hick's Law, etc.), not personal preference. Reference the principle in your notes.

Respond in EXACTLY this JSON format (no markdown, no extra text):
{{"clarity": 7, "urgency": 3, "trust": 5, "friction": 6, "mobile_readiness": 5, "notes": "Brief explanation of key issues and recommendations"}}
"""


def evaluate_llm_judge(page_html: str, page_url: str, page_name: str) -> LLMScores:
    """Score a single page using Claude API as a CRO judge."""
    try:
        import anthropic
    except ImportError:
        print("  Warning: anthropic package not installed. Skipping LLM judge.")
        return LLMScores()

    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        print("  Warning: ANTHROPIC_API_KEY not set. Skipping LLM judge.")
        return LLMScores()

    client = anthropic.Anthropic(api_key=api_key)

    # Truncate HTML to avoid token limits (keep first 15K chars — enough for structure)
    truncated_html = page_html[:15000]
    if len(page_html) > 15000:
        truncated_html += "\n\n[... HTML truncated for evaluation ...]"

    prompt = LLM_JUDGE_PROMPT.format(page_name=page_name, page_url=page_url)

    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            messages=[
                {"role": "user", "content": f"{prompt}\n\nHTML content:\n{truncated_html}"}
            ],
        )
        response_text = message.content[0].text.strip()

        # Parse JSON from response
        # Handle cases where model wraps in markdown code block
        json_match = re.search(r'\{[^}]+\}', response_text, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
        else:
            data = json.loads(response_text)

        return LLMScores(
            clarity=float(data.get("clarity", 0)),
            urgency=float(data.get("urgency", 0)),
            trust=float(data.get("trust", 0)),
            friction=float(data.get("friction", 0)),
            mobile_readiness=float(data.get("mobile_readiness", 0)),
            notes=data.get("notes", ""),
        )
    except Exception as e:
        print(f"  LLM judge error for {page_url}: {e}")
        return LLMScores()


# ── 2. Lighthouse ──────────────────────────────────────────────────────────────

def evaluate_lighthouse(url: str) -> LighthouseScores:
    """Run Lighthouse against a URL and return scores."""
    chrome_path = _find_chrome()

    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        cmd = [
            "npx", "lighthouse", url,
            "--output=json",
            f"--output-path={tmp_path}",
            "--quiet",
            f"--chrome-flags=--headless --no-sandbox --disable-gpu",
            "--only-categories=performance,accessibility,best-practices,seo",
        ]
        env = os.environ.copy()
        env["CHROME_PATH"] = chrome_path

        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=120, env=env
        )

        if not os.path.exists(tmp_path) or os.path.getsize(tmp_path) == 0:
            print(f"  Lighthouse produced no output for {url}")
            if result.stderr:
                print(f"  stderr: {result.stderr[-300:]}")
            return LighthouseScores()

        with open(tmp_path, "r", errors="replace") as f:
            data = json.load(f)

        categories = data.get("categories", {})
        audits = data.get("audits", {})

        # Extract LCP from audits
        lcp_audit = audits.get("largest-contentful-paint", {})
        lcp_ms = lcp_audit.get("numericValue", 0)

        cls_audit = audits.get("cumulative-layout-shift", {})
        cls_val = cls_audit.get("numericValue", 0)

        return LighthouseScores(
            performance=(categories.get("performance", {}).get("score", 0) or 0) * 100,
            accessibility=(categories.get("accessibility", {}).get("score", 0) or 0) * 100,
            best_practices=(categories.get("best-practices", {}).get("score", 0) or 0) * 100,
            seo=(categories.get("seo", {}).get("score", 0) or 0) * 100,
            lcp_ms=lcp_ms,
            cls=cls_val,
        )
    except subprocess.TimeoutExpired:
        print(f"  Lighthouse timed out for {url}")
        return LighthouseScores()
    except Exception as e:
        print(f"  Lighthouse error for {url}: {e}")
        return LighthouseScores()
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


# ── 3. Playwright Journeys (with HTML-parsing fallback) ───────────────────────

def _evaluate_journeys_html(site_dir: Path) -> JourneyScores:
    """
    Fallback journey evaluation using pure HTML parsing when Playwright/Chrome
    can't connect (e.g., sandboxed environments). Less accurate than browser-based
    testing but captures structural CRO signals.
    """
    from html.parser import HTMLParser

    scores = JourneyScores()

    def _read_page(page_path: str) -> str:
        candidates = [
            site_dir / page_path.strip("/") / "index.html",
            site_dir / (page_path.strip("/") + ".html"),
        ]
        if page_path == "/":
            candidates = [site_dir / "index.html"]
        for c in candidates:
            if c.exists():
                return c.read_text(errors="replace")
        return ""

    # ── Test 1: Links to /free-trial/ from homepage ──
    homepage = _read_page("/")
    homepage_lower = homepage.lower()
    trial_link_count = homepage_lower.count('href') and homepage_lower.count('free-trial')
    if trial_link_count > 0:
        # Check if link appears in first 3000 chars (rough "above fold" proxy)
        first_chunk = homepage_lower[:3000]
        if 'free-trial' in first_chunk or 'free trial' in first_chunk:
            scores.clicks_to_trial = 10.0
        else:
            scores.clicks_to_trial = 7.0
    else:
        scores.clicks_to_trial = 0.0

    # ── Test 2: Free trial CTA above fold ──
    cta_terms = ['start free', 'try for free', 'free trial', 'get started', 'try rove']
    first_chunk = homepage_lower[:3000]
    scores.cta_above_fold = 10.0 if any(t in first_chunk for t in cta_terms) else 0.0

    # ── Test 3: Form fields on /free-trial/ ──
    trial_html = _read_page("/free-trial/").lower()
    import re as _re
    input_fields = _re.findall(
        r'<input[^>]*type=["\'](?:text|email|tel|password)["\']', trial_html
    )
    textarea_count = trial_html.count('<textarea')
    select_count = trial_html.count('<select')
    n_fields = len(input_fields) + textarea_count + select_count
    scores.form_field_count = max(0.0, 10.0 - max(0, n_fields - 1))

    # ── Test 4: Competing CTAs on /free-trial/ ──
    cta_patterns = ['book a demo', 'book your', 'free demo', 'try for free',
                    'start free', 'calculate your roi', 'contact us']
    found_ctas = sum(1 for p in cta_patterns if p in trial_html)
    scores.competing_ctas = max(0.0, 10.0 - max(0, (found_ctas - 1) * 3.3))

    # ── Test 5: Free tier visible on /pricing/ ──
    pricing_html = _read_page("/pricing/").lower()
    free_terms = ['free', '£0', '$0', 'no cost', 'starter', '0/month']
    scores.free_tier_visible = 10.0 if any(t in pricing_html for t in free_terms) else 0.0

    # ── Test 6: Feature overload on /pricing/ ──
    n_rows = pricing_html.count('<tr')
    feature_divs = len(_re.findall(r'class=["\'][^"\']*feature[^"\']*["\']', pricing_html))
    n_features = max(n_rows, feature_divs)
    if n_features <= 10:
        scores.feature_overload = 10.0
    elif n_features <= 20:
        scores.feature_overload = 5.0
    else:
        scores.feature_overload = max(0.0, 10.0 - (n_features - 10) * 0.5)

    # ── Test 7: Calendar embed on /book-a-demo/ ──
    demo_html = _read_page("/book-a-demo/").lower()
    calendar_signals = ['calendly', 'chilipiper', 'hubspot', 'data-calendar', 'calendar-embed']
    scores.calendar_embed = 10.0 if any(s in demo_html for s in calendar_signals) else 0.0

    # ── Test 8: Nav stripped on landing page ──
    lp_html = _read_page("/lp/market-intelligence/").lower()
    nav_signals = ['<nav', 'class="navbar', 'class="nav-menu', 'class="navigation']
    scores.nav_stripped = 10.0 if not any(s in lp_html for s in nav_signals) else 0.0

    # ── Test 9: Mobile tap targets (heuristic) ──
    # Can't measure actual pixel sizes without a browser — use heuristic based on
    # whether the page has viewport meta tag and reasonable button styling
    all_pages_html = ''.join(_read_page(p) for p, _ in EVAL_PAGES)
    has_viewport = 'viewport' in all_pages_html.lower()
    scores.mobile_tap_targets = 6.0 if has_viewport else 2.0

    return scores


def evaluate_journeys(base_url: str, site_dir: Path = None) -> JourneyScores:
    """
    Run automated journey tests. Tries Playwright first; falls back to HTML
    parsing if the browser can't connect (sandboxed environments, no Chrome, etc.).
    """
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("  Warning: playwright not installed. Using HTML-parsing fallback.")
        if site_dir:
            return _evaluate_journeys_html(site_dir)
        return JourneyScores()

    scores = JourneyScores()

    try:
        with sync_playwright() as p:
            # Find Chrome binary — prefer explicit path for environments
            # where playwright install didn't work
            chrome_path = None
            for c in CHROME_CANDIDATES:
                if c and os.path.isfile(c):
                    chrome_path = c
                    break

            launch_kwargs = {
                "headless": True,
                "args": ["--no-sandbox", "--disable-gpu", "--no-proxy-server"],
            }
            if chrome_path:
                launch_kwargs["executable_path"] = chrome_path

            browser = p.chromium.launch(**launch_kwargs)

            # Desktop viewport
            desktop = browser.new_context(viewport={"width": 1280, "height": 720})
            # Mobile viewport
            mobile = browser.new_context(
                viewport={"width": 375, "height": 812},
                is_mobile=True,
                user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
            )

            # ── Test 1: Clicks to reach /free-trial/ from homepage ──
            page = desktop.new_page()
            page.goto(f"{base_url}/", wait_until="domcontentloaded", timeout=15000)

            # Look for links to free-trial
            trial_links = page.query_selector_all('a[href*="free-trial"], a[href*="free_trial"]')
            if trial_links:
                # Check if any are visible above the fold
                for link in trial_links:
                    box = link.bounding_box()
                    if box and box["y"] < 720:
                        scores.clicks_to_trial = 10.0  # 1 click, above fold
                        break
                else:
                    scores.clicks_to_trial = 7.0  # 1 click but below fold
            else:
                # Check for any "free" or "trial" or "start" buttons
                free_buttons = page.query_selector_all('a:has-text("free"), a:has-text("trial"), a:has-text("Start")')
                scores.clicks_to_trial = 5.0 if free_buttons else 0.0
            page.close()

            # ── Test 2: CTA above fold on homepage ──
            page = desktop.new_page()
            page.goto(f"{base_url}/", wait_until="domcontentloaded", timeout=15000)
            cta_selectors = [
                'a:has-text("Start free")',
                'a:has-text("Try for free")',
                'a:has-text("free trial")',
                'button:has-text("Start free")',
                'button:has-text("Try")',
                'a:has-text("Get started")',
            ]
            cta_found = False
            for sel in cta_selectors:
                elements = page.query_selector_all(sel)
                for el in elements:
                    box = el.bounding_box()
                    if box and box["y"] < 720:
                        cta_found = True
                        break
                if cta_found:
                    break
            scores.cta_above_fold = 10.0 if cta_found else 0.0
            page.close()

            # ── Test 3: Form fields on /free-trial/ ──
            page = desktop.new_page()
            page.goto(f"{base_url}/free-trial/", wait_until="domcontentloaded", timeout=15000)
            form_fields = page.query_selector_all(
                'input[type="text"], input[type="email"], input[type="tel"], '
                'input[type="password"], textarea, select'
            )
            n_fields = len(form_fields)
            # Score: 1 field = 10, 2 = 9, 3 = 8, ... 10+ = 0
            scores.form_field_count = max(0.0, 10.0 - max(0, n_fields - 1))
            page.close()

            # ── Test 4: Competing CTAs on /free-trial/ ──
            page = desktop.new_page()
            page.goto(f"{base_url}/free-trial/", wait_until="domcontentloaded", timeout=15000)
            # Count distinct CTA-like buttons/links (exclude nav)
            buttons = page.query_selector_all(
                'main a[class*="button"], main a[class*="btn"], '
                'main button[type="submit"], .hero a, .cta a, '
                'a:has-text("demo"), a:has-text("book"), a:has-text("trial"), '
                'a:has-text("free"), a:has-text("start"), button:has-text("submit")'
            )
            # Deduplicate by href
            hrefs = set()
            for btn in buttons:
                href = btn.get_attribute("href") or btn.inner_text()
                hrefs.add(href)
            n_ctas = len(hrefs)
            # 1 CTA = 10, 2 = 7, 3 = 4, 4+ = 0
            scores.competing_ctas = max(0.0, 10.0 - max(0, (n_ctas - 1) * 3.3))
            page.close()

            # ── Test 5: Free tier visible on /pricing/ ──
            page = desktop.new_page()
            page.goto(f"{base_url}/pricing/", wait_until="domcontentloaded", timeout=15000)
            page_text = page.inner_text("body").lower()
            has_free = any(term in page_text for term in ["free", "£0", "$0", "no cost", "starter"])
            scores.free_tier_visible = 10.0 if has_free else 0.0
            page.close()

            # ── Test 6: Feature overload on /pricing/ ──
            page = desktop.new_page()
            page.goto(f"{base_url}/pricing/", wait_until="domcontentloaded", timeout=15000)
            # Count rows in comparison tables
            table_rows = page.query_selector_all("tr, [class*='feature'], [class*='row']")
            n_features = len(table_rows)
            # <10 features = 10, 10–20 = 5, 20+ = 0
            if n_features <= 10:
                scores.feature_overload = 10.0
            elif n_features <= 20:
                scores.feature_overload = 5.0
            else:
                scores.feature_overload = max(0.0, 10.0 - (n_features - 10) * 0.5)
            page.close()

            # ── Test 7: Calendar embed on /book-a-demo/ ──
            page = desktop.new_page()
            page.goto(f"{base_url}/book-a-demo/", wait_until="domcontentloaded", timeout=15000)
            calendar_selectors = [
                'iframe[src*="calendly"]', 'iframe[src*="chilipiper"]',
                'iframe[src*="hubspot"]', '[class*="calendar"]',
                '[data-calendly]', '.calendly-inline-widget',
            ]
            has_calendar = any(page.query_selector(sel) for sel in calendar_selectors)
            scores.calendar_embed = 10.0 if has_calendar else 0.0
            page.close()

            # ── Test 8: Nav stripped on landing page ──
            page = desktop.new_page()
            page.goto(f"{base_url}/lp/market-intelligence/", wait_until="domcontentloaded", timeout=15000)
            nav_elements = page.query_selector_all("nav, header nav, [class*='navbar'], [class*='nav-menu']")
            scores.nav_stripped = 10.0 if len(nav_elements) == 0 else 0.0
            page.close()

            # ── Test 9: Mobile tap targets ──
            m_page = mobile.new_page()
            total_targets = 0
            compliant_targets = 0
            for path, _ in EVAL_PAGES:
                try:
                    m_page.goto(f"{base_url}{path}", wait_until="domcontentloaded", timeout=15000)
                    tappable = m_page.query_selector_all("a, button, input, select, textarea, [role='button']")
                    for el in tappable:
                        box = el.bounding_box()
                        if box:
                            total_targets += 1
                            # 48×48px minimum per WCAG/Google guidelines
                            if box["width"] >= 44 and box["height"] >= 44:
                                compliant_targets += 1
                except Exception:
                    pass
            if total_targets > 0:
                scores.mobile_tap_targets = (compliant_targets / total_targets) * 10
            m_page.close()

            desktop.close()
            mobile.close()
            browser.close()

    except Exception as e:
        print(f"  Playwright browser error: {e}")
        print("  Falling back to HTML-parsing journey evaluation...")
        if site_dir:
            return _evaluate_journeys_html(site_dir)
        # Try to infer site_dir from base_url (assumes standard setup)
        from prepare_web import SITE_DIR
        if SITE_DIR.exists():
            return _evaluate_journeys_html(SITE_DIR)

    return scores


# ── Composite Evaluation ───────────────────────────────────────────────────────

def evaluate_all(base_url: str, site_dir: Path) -> EvalResult:
    """
    Run all three evaluation methods across all target pages.
    Returns a complete EvalResult with composite score.
    """
    result = EvalResult()
    page_results = []

    for page_path, page_name in EVAL_PAGES:
        print(f"\n  Evaluating {page_name} ({page_path})...")
        pr = PageResult(url=page_path, name=page_name)

        # Read HTML for LLM judge
        html_candidates = [
            site_dir / page_path.strip("/") / "index.html",
            site_dir / (page_path.strip("/") + ".html"),
        ]
        if page_path == "/":
            html_candidates = [site_dir / "index.html"]

        page_html = ""
        for candidate in html_candidates:
            if candidate.exists():
                page_html = candidate.read_text(errors="replace")
                break

        full_url = f"{base_url}{page_path}"

        # 1. LLM Judge
        print(f"    LLM judge...")
        pr.llm = evaluate_llm_judge(page_html, page_path, page_name)
        print(f"    → Clarity={pr.llm.clarity}, Urgency={pr.llm.urgency}, "
              f"Trust={pr.llm.trust}, Friction={pr.llm.friction}, "
              f"Mobile={pr.llm.mobile_readiness}")

        # 2. Lighthouse
        print(f"    Lighthouse...")
        pr.lighthouse = evaluate_lighthouse(full_url)
        print(f"    → Perf={pr.lighthouse.performance}, A11y={pr.lighthouse.accessibility}, "
              f"SEO={pr.lighthouse.seo}, LCP={pr.lighthouse.lcp_ms:.0f}ms")

        page_results.append(pr)

    # 3. Playwright journeys (runs across all pages)
    print(f"\n  Running Playwright journey tests...")
    journey_scores = evaluate_journeys(base_url, site_dir=site_dir)
    print(f"    → clicks_to_trial={journey_scores.clicks_to_trial}, "
          f"cta_above_fold={journey_scores.cta_above_fold}, "
          f"free_tier_visible={journey_scores.free_tier_visible}")

    # Apply journey scores to result (shared across pages)
    for pr in page_results:
        pr.journey = journey_scores

    # ── Compute averages ──
    n = len(page_results)
    if n == 0:
        return result

    result.pages = page_results
    result.pages_evaluated = n

    # LLM averages
    result.clarity_avg = sum(p.llm.clarity for p in page_results) / n
    result.urgency_avg = sum(p.llm.urgency for p in page_results) / n
    result.trust_avg = sum(p.llm.trust for p in page_results) / n
    result.friction_avg = sum(p.llm.friction for p in page_results) / n
    result.mobile_avg = sum(p.llm.mobile_readiness for p in page_results) / n
    result.llm_judge_avg = sum(p.llm.average for p in page_results) / n

    # Lighthouse averages
    result.lighthouse_perf = sum(p.lighthouse.performance for p in page_results) / n
    result.lighthouse_a11y = sum(p.lighthouse.accessibility for p in page_results) / n
    result.lighthouse_seo = sum(p.lighthouse.seo for p in page_results) / n
    result.lcp_ms = sum(p.lighthouse.lcp_ms for p in page_results) / n
    result.cls = sum(p.lighthouse.cls for p in page_results) / n
    result.lighthouse_avg = sum(p.lighthouse.normalised for p in page_results) / n

    # Journey average
    result.journey_avg = journey_scores.average

    # ── Composite score ──
    result.composite_cro = (
        W_LLM * result.llm_judge_avg +
        W_LIGHTHOUSE * result.lighthouse_avg +
        W_PLAYWRIGHT * result.journey_avg
    )

    return result


def print_results(result: EvalResult):
    """Print results in a grep-friendly format matching autoresearch convention."""
    print("---")
    print(f"composite_cro:    {result.composite_cro:.3f}")
    print(f"llm_judge_avg:    {result.llm_judge_avg:.3f}")
    print(f"lighthouse_avg:   {result.lighthouse_avg:.3f}")
    print(f"journey_avg:      {result.journey_avg:.3f}")
    print(f"clarity_avg:      {result.clarity_avg:.3f}")
    print(f"urgency_avg:      {result.urgency_avg:.3f}")
    print(f"trust_avg:        {result.trust_avg:.3f}")
    print(f"friction_avg:     {result.friction_avg:.3f}")
    print(f"mobile_avg:       {result.mobile_avg:.3f}")
    print(f"lighthouse_perf:  {result.lighthouse_perf:.3f}")
    print(f"lighthouse_a11y:  {result.lighthouse_a11y:.3f}")
    print(f"lighthouse_seo:   {result.lighthouse_seo:.3f}")
    print(f"lcp_ms:           {result.lcp_ms:.3f}")
    print(f"cls:              {result.cls:.6f}")
    print(f"pages_evaluated:  {result.pages_evaluated}")

    # Per-page LLM notes
    for pr in result.pages:
        if pr.llm.notes:
            print(f"notes_{pr.name.lower().replace(' ', '_')}: {pr.llm.notes[:200]}")
