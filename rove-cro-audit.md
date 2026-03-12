# Rove CRO Audit & Iterative Improvement Plan

**Prepared for:** James Clark, Head of Growth
**Date:** 12 March 2026
**Scope:** Full page-by-page audit of go-rove.com with phased action plan
**Agency brief companion for:** Rocket

---

## Executive Summary

Rove's current session-to-signup rate is **0.68%** against an industry benchmark of **8–16%** (FirstPageSage, 86 SaaS companies, 2022–2025). This represents a **12× gap to the low end of benchmark**. The root causes are structural, not cosmetic:

1. **The "free trial" is not a free trial.** It's a lead-capture form that gives 1 credit and delivers results in 48 hours. This is a demo request wearing a free-trial costume. True freemium (self-serve, instant value) does not exist on the site.
2. **No dedicated paid landing pages.** Google Ads traffic lands on the homepage; Meta traffic lands on /free-trial/. Neither is optimised for paid intent.
3. **The pricing page is broken.** 33.3% engagement rate means two-thirds of visitors bounce without interacting. The tiers, credits, and value are unclear.
4. **Mobile experience is catastrophic.** 20.6s LCP makes paid mobile traffic essentially wasted spend.
5. **The highest-converting asset (ROI calculator) is buried.** Only 27 sessions despite 14.8% key event rate — the best on the site.

The plan below targets lifting session-to-signup from 0.68% → 2% (Wave 1), → 4–5% (Wave 2), → 6–8% (Wave 3).

---

## PART 1: Page-by-Page Audit

---

### 1. Homepage (/)

**Sessions:** 633 | **Engagement rate:** 72.2% | **Key event rate:** 8.2%

**Primary purpose:** Educate and route visitors to conversion (free trial or demo).
**Current CTA hierarchy:**
- Primary: "Book your free demo" (nav + hero + repeated in body)
- Secondary: "Try for free" (buried in feature sections)
- Tertiary: "Calculate your ROI" (text link)

**Content-to-CTA ratio:** Heavily content-front-loaded. Five feature deep-dives before any meaningful free-trial push. Approximately 2,500 words before the final CTA section.

**Trust signals:** 4 partner logos (Exertis, CBBC, UK-India, Chamber International), 1 case study (de Faire Medical), founder quote. No customer count, no specific metrics (revenue generated, markets entered), no third-party review badges.

**Friction points:**
- **CTA confusion.** "Book your free demo" is primary, but the stated business goal is freemium signup. The homepage actively routes visitors away from free trial toward a sales-led motion.
- **No above-the-fold free trial CTA.** The hero pushes demo booking. "Try for free" appears only in feature subsections lower on the page.
- **Value prop is diluted.** Five product dimensions (Market Intelligence, Customer Profiling, Social Listening, Supply Chain, Legal & Regulatory) create cognitive overload. The visitor must process too much before acting. (Hick's Law: more choices = longer decision time = more abandonment. Hick, 1952.)
- **"99% faster than consultants. 10% of the cost."** Strong claim but unsubstantiated on this page. No comparison table, no breakdown. Risks being dismissed as marketing fluff. (Cialdini's Authority principle requires evidence to activate.)
- **No personalisation by ICP.** All four personas (Sophie, Harry, Wendy, Liam) see identical messaging. No "I'm a…" routing.

**Scores (1–10):**

| Dimension | Score | Notes |
|-----------|-------|-------|
| Clarity | 5 | Too many messages competing. What does Rove actually *do* in one sentence? |
| Urgency | 3 | No urgency triggers. No scarcity, no social proof momentum. |
| Trust | 5 | Logos are good but generic. No customer count, no review scores. |
| Friction | 7 (high = bad) | Wrong primary CTA. Too much content before action. |
| Mobile-readiness | 3 | 20.6s LCP is a dealbreaker. |

---

### 2. Free Trial Page (/free-trial/)

**Sessions:** 257 | **Key events:** 13 | **On-page conversion:** 5.1% | **Session-to-signup:** 0.68%

**Primary purpose:** Convert visitors to free accounts.
**Current CTA hierarchy:**
- Primary: Email signup form
- Secondary: "Book your free demo"
- Tertiary: "Calculate your ROI"

**Critical finding: This is not a freemium page.**
The page offers **1 free credit** for a single Rove Scan, delivered in **48 hours**. This is functionally a gated lead-gen form, not a self-serve product trial. The user submits their email and then waits. There is no instant value delivery, no dashboard access, no self-serve experience.

**Benchmark context:** The 8–16% freemium signup benchmark (FirstPageSage) applies to products where users get *immediate* access to a functional product tier. Rove's current model is closer to a "request a sample" flow, where industry benchmarks are 2–5% (Demand Gen Report, 2024).

**Friction points:**
- **48-hour delay kills momentum.** Fogg Behaviour Model (B = MAT) requires motivation, ability, and trigger to align in the *same moment*. A 48-hour delay breaks this chain. By the time results arrive, the visitor's motivation has decayed.
- **"1 credit" is confusing.** New visitors don't know what a credit is, what a Rove Scan includes, or whether 1 credit is enough to evaluate the product.
- **No preview of output.** The visitor cannot see what they'll get. No sample report, no screenshot of results, no video walkthrough of a completed scan.
- **Competing CTAs.** "Book your free demo" appears on the free trial page itself, creating a choice where there should be a single path. (Paradox of choice; Schwartz, 2004.)
- **Form is Contact Form 7.** No progressive profiling, no inline validation, no auto-fill. Basic infrastructure for the highest-leverage page on the site.
- **No post-submission experience documented.** No confirmation page, no "check your email" instruction, no onboarding sequence indication.

**Trust signals:** Same 4 partner logos. de Faire Medical case study. "Hundreds of brands" claim (unverified, no number).

**Scores:**

| Dimension | Score | Notes |
|-----------|-------|-------|
| Clarity | 4 | What exactly do I get? When? What does a scan look like? |
| Urgency | 2 | No reason to sign up *now* vs next week. |
| Trust | 4 | "Hundreds of brands" with no number is weaker than silence. |
| Friction | 8 | 48-hour delay, unclear deliverable, competing CTAs. |
| Mobile-readiness | 3 | Inherits sitewide LCP issues. |

---

### 3. Book a Demo (/book-a-demo/)

**Sessions:** 113 | **Key events:** 11 | **On-page conversion:** 9.7%

**Primary purpose:** Schedule a sales demo.
**Current CTA hierarchy:** Single — book a demo form.

**This page is working.** 9.7% on-page conversion is strong for a B2B demo request page (benchmark: 5–10%, Unbounce Conversion Benchmark Report, 2024). Protect it.

**Strengths:**
- Clear single CTA — no competing asks.
- Pain-led headline: "Unrealistic expectations. Unverified data. Sound familiar?" speaks directly to ICP frustration.
- 4-step expectation-setting (book → walkthrough → methodology → start) reduces anxiety.
- FAQ section addresses common objections pre-form.

**Friction points (minor):**
- No calendar embed visible — if the form submits to a human who then emails a Calendly link, that's an unnecessary step. Direct calendar booking (Chilipiper, Calendly embed) reduces drop-off by 30–50% (Chili Piper benchmark data, 2023).
- No social proof from *demo attendees* specifically ("I booked a demo and within a week we had our first scan results" — that kind of testimonial).

**Scores:**

| Dimension | Score | Notes |
|-----------|-------|-------|
| Clarity | 8 | Clear what you get and what happens next. |
| Urgency | 5 | Could add "next available slot: tomorrow" dynamic element. |
| Trust | 6 | Good FAQ but no demo-specific testimonials. |
| Friction | 3 | Low friction, but calendar embed would improve. |
| Mobile-readiness | 3 | Sitewide LCP issue. |

---

### 4. Pricing (/pricing/)

**Sessions:** 30 | **Engagement rate:** 33.3% — **This page is critically broken.**

**Primary purpose:** Help visitors self-select a tier and convert.

**Critical issues:**

**A) Pricing doesn't match stated model.** The CRO brief describes Free (15 credits), Pro (£225), Max (£675). The live site shows Bronze (£280), Silver (£799), Gold (£1,599), Enterprise (custom). This is either a planned change that hasn't shipped, or there's a disconnect between product and marketing. Either way, the current live pricing has no free tier visible — **which means the freemium funnel has no pricing page support**.

**B) 66.7% bounce rate.** Two-thirds of visitors leave without engaging. Root causes:
- **Credit system is opaque.** "1 Credit = 1 Market Scan" — but what's in a scan? How many credits do I need? What does £280/month *actually* get me?
- **28-feature comparison table.** Requires scrolling, desktop viewing, and domain knowledge to interpret. This violates progressive disclosure principles (Nielsen Norman Group).
- **No free tier shown.** If the freemium model exists, it's invisible here.
- **All CTAs route to "Book your free demo" or "Contact Sales."** There is no self-serve purchase path. Even if a visitor wanted to buy, they can't.
- **No ROI context.** Pricing exists in a vacuum. No "this replaces £25,000 of consulting" context. No case study linking price to outcome.

**C) 30 sessions = almost no traffic.** The pricing page isn't linked prominently enough. It's a nav item that most visitors never reach.

**Scores:**

| Dimension | Score | Notes |
|-----------|-------|-------|
| Clarity | 2 | Confusing tiers, opaque credits, no free tier shown. |
| Urgency | 1 | No reason to act. No annual discount urgency. |
| Trust | 3 | No social proof on this page. No "1,200 brands" type stats. |
| Friction | 9 | Can't self-serve. Can't understand value. 28-feature table. |
| Mobile-readiness | 2 | Complex comparison table on mobile = unusable. |

---

### 5. About Us (/about-us/)

**Sessions:** 58

**Purpose:** Build trust and credibility for B2B buyers doing due diligence.

**Strengths:**
- Three co-founders with serious credentials (Tesco, Kingfisher, Co-op, Phones4U). This is strong trust signal material.
- Specific numbers: "$85M revenue across 60 countries" (Simon Boyd), "$150M retail sales in 70 markets" (Smoothskin).

**Friction points:**
- **No funding/investor information.** B2B buyers (especially enterprise) want to know the company is financially stable.
- **No customer testimonials on this page.** Missed opportunity — this is where due-diligence visitors land.
- **No team size indicator.** "Is this a 3-person startup or a 50-person company?" matters to enterprise buyers.
- **CTA is generic.** "Try Rove for free" / "Book your free demo" — should link to the strongest trust-building conversion (demo, probably).

**Scores:**

| Dimension | Score | Notes |
|-----------|-------|-------|
| Clarity | 7 | Clear who they are and their background. |
| Urgency | 1 | No conversion urgency. |
| Trust | 7 | Strong founder bios. Missing team/funding/customer proof. |
| Friction | 4 | Low friction but also low conversion intent. |
| Mobile-readiness | 5 | Simple content page, likely okay. |

---

### 6. Case Study (/case-study/)

**Sessions:** 30

**Purpose:** Provide social proof and demonstrate ROI.

**Content:** Single case study — de Faire Medical (BeaT-2 blood sugar supplement).

**Strengths:**
- Real company, named contact (Alex Pitt, Commercial Director).
- Specific results: 10–12 markets assessed, ~10× cost reduction, accelerated timeline.
- Direct quotes addressing SMB pain points.

**Friction points:**
- **Only one case study.** One data point is an anecdote, not proof. B2B buyers need 3+ case studies to feel confident (TrustRadius B2B Buying Disconnect Report, 2023).
- **Wrong ICP fit for top personas.** de Faire Medical is a health supplement company. None of the four ICP personas (homeware, wellness/beauty, luxury, scaling commercial leader) see *themselves* in this case study.
- **No hard revenue numbers.** "10× cost reduction" relative to what? No absolute figures.
- **30 sessions is insufficient traffic.** The case study isn't promoted enough — no homepage carousel, no email sequence link, no ad creative featuring it.

**Scores:**

| Dimension | Score | Notes |
|-----------|-------|-------|
| Clarity | 6 | Clear story but generic results. |
| Urgency | 2 | No urgency mechanism. |
| Trust | 5 | One case study is a start, not proof. |
| Friction | 3 | Simple read, clear CTAs. |
| Mobile-readiness | 5 | Content page, likely acceptable. |

---

### 7. ROI Calculator (/roi-calculator/)

**Sessions:** 27 | **Key event rate:** 14.8% — **Highest on the site.**

**Purpose:** Quantify the cost savings of using Rove vs traditional consulting.

**This is the most underutilised asset on the entire site.**

14.8% key event rate with only 27 sessions means the people who find it love it — but almost nobody finds it. It's buried as a text link. At the homepage's traffic level (633 sessions), if 20% reached the calculator and it maintained its conversion rate, that would be ~19 key events vs the current 4.

**Friction points:**
- **Discoverability.** Not in the main nav. Only appears as a tertiary text link. No visual prominence anywhere.
- **No social proof on output.** Calculator results should include "Brands like [X] saved £[Y] by switching to Rove" alongside the calculation.

**Scores:**

| Dimension | Score | Notes |
|-----------|-------|-------|
| Clarity | 7 | Clear purpose, clear value. |
| Urgency | 6 | Seeing your own savings creates urgency. |
| Trust | 5 | Calculator builds trust through transparency. |
| Friction | 3 | Interactive tool = low friction. |
| Mobile-readiness | 4 | Likely functional but unverified. |

---

### 8. Partners — Chamber International (/partners/chamber-international/)

**Sessions:** 13

**Purpose:** Co-branded landing page for Chamber International referrals.

Low traffic, niche audience. The page is competent but not a priority. Main issue: CTA sends to generic free trial rather than a partner-specific welcome experience.

---

### 9. Blog (/blog/)

**Sessions:** Varies by post | **3 posts visible**

**Purpose:** SEO and thought leadership entry point.

**Critical issue: Only 3 blog posts.** For SEO to drive meaningful organic traffic, you need 30–50 posts minimum targeting long-tail keywords (Ahrefs Content Marketing study, 2023). Three posts is a placeholder, not a strategy.

**Topics are solid** (China live shopping, physical retail in 2026, 3 questions before expanding) but there's no content velocity.

---

### 10. Webinars (/webinars/)

**Sessions:** Varies | **0 upcoming events**

**Purpose:** Event-driven lead gen.

Two past webinars available on-demand. No upcoming events listed. The page currently signals inactivity — "Stay tuned for upcoming webinars" with no date or topic is weaker than removing the section entirely.

---

### 11. Paid Landing Pages

**Current state: They don't exist.**

- Google Ads traffic → homepage with HSA params. No dedicated landing page.
- Meta traffic → /free-trial/ with FB params. Not optimised for paid intent.
- /lp/demo → **Returns 404.** The page referenced in the agency brief doesn't exist yet.

This is the single highest-impact gap. Paid traffic should never land on a homepage. (Unbounce benchmark: dedicated landing pages convert 2.6× higher than homepage traffic; Unbounce Conversion Benchmark Report, 2024.)

---

## PART 2: Funnel Friction Mapping

### Channel → Journey → Drop-off Points

#### Google Ads → Homepage → ???
```
Google Ads (295 sessions, 10.2% key event rate)
  → Homepage (/)
    → Problem: No paid-specific messaging, no UTM-triggered CTA variation
    → 72.2% engagement (27.8% immediate bounce)
    → Primary CTA is "Book a demo" (not free trial)
    → Users must self-navigate to /free-trial/ (only 13.4% of all traffic reaches it)
    → LEAK: 86.6% of sessions never see the free trial page
```

#### Meta Ads → /free-trial/ → ???
```
Meta Ads (321 sessions, 5.9% key event rate)
  → /free-trial/ page
    → 5.1% on-page conversion (form submit)
    → 48-hour delay before value delivery
    → LEAK: No instant gratification. User leaves and forgets.
    → No retargeting pixel event for "started form but didn't submit"
```

#### LinkedIn Ads → /book-a-demo/ → ???
```
LinkedIn Ads (123 sessions, 13.0% key event rate — highest intent)
  → /book-a-demo/
    → 9.7% on-page conversion
    → WORKING WELL — protect this flow
    → Opportunity: Could be higher with calendar embed
```

#### Organic Search → Homepage → ???
```
Organic (308 sessions, 6.2% key event rate)
  → Homepage or blog post
    → Blog has only 3 posts (minimal organic capture)
    → Homepage doesn't differentiate organic visitors
    → LEAK: No content upgrade, no lead magnet, no email capture for non-ready visitors
```

#### Direct → Homepage → ???
```
Direct (567 sessions, 5.6% key event rate)
  → Homepage
    → These are likely repeat visitors, referral traffic, or brand-aware
    → 5.6% is below average for brand-aware traffic (benchmark 8–12%)
    → LEAK: Homepage doesn't reward returning visitors with any new information or urgency
```

### Leaky Bucket Pages (Engagement Rate < 60%)

| Page | Engagement Rate | Status |
|------|----------------|--------|
| /pricing/ | 33.3% | **CRITICAL — 2/3 of visitors bounce** |

The pricing page is the only page below the 60% threshold with the data provided, but at 33.3% it's catastrophically low.

---

## PART 3: Structured Hypotheses

### H1: Homepage Primary CTA Swap (P1)

```
PAGE:       /
ISSUE:      Primary CTA is "Book your free demo" but the business goal is
            freemium signup. 633 sessions see demo as the default action.
            Only 13.4% of all traffic reaches /free-trial/.
HYPOTHESIS: If we make "Start free — no card required" the primary hero CTA
            and demote "Book a demo" to secondary navigation, then the
            percentage of sessions reaching free trial will increase from
            13.4% to 25%+, because reducing the number of choices and
            aligning the default action with the lowest-commitment conversion
            removes decision friction (Hick's Law).
PRIORITY:   P1 — highest traffic page × direct conversion impact × zero dev
TEST:       Before/after with 2-week measurement window
SUCCESS:    /free-trial/ sessions increase from 257 to 500+ per period
            Session-to-signup rate increases from 0.68% to 1.5%+
```

### H2: Free Trial Page — Show the Output (P1)

```
PAGE:       /free-trial/
ISSUE:      Visitors are asked to submit their email for something they've
            never seen. No sample report, no screenshot of scan results,
            no video walkthrough. 5.1% on-page conversion.
HYPOTHESIS: If we add a sample Rove Scan report (anonymised or example)
            above the fold — showing exactly what the user will receive —
            then on-page conversion will increase from 5.1% to 10%+, because
            showing the end state before asking for commitment reduces
            perceived risk (Endowed Progress Effect; Nunes & Dreze, 2006)
            and activates desire through specificity.
PRIORITY:   P1 — highest-leverage page × high impact × low effort (design asset)
TEST:       A/B test if traffic permits; otherwise before/after
SUCCESS:    /free-trial/ on-page conversion from 5.1% to 10%+
```

### H3: Free Trial Page — Remove Competing Demo CTA (P1)

```
PAGE:       /free-trial/
ISSUE:      "Book your free demo" CTA appears on the free trial page,
            creating choice paralysis on the single most important
            conversion page.
HYPOTHESIS: If we remove the demo CTA from /free-trial/ entirely (keeping
            it in nav only), then free trial form submissions will increase
            by 15–25%, because single-CTA pages convert higher than
            multi-CTA pages (Unbounce: pages with one CTA convert 1.6×
            higher than pages with 2+ CTAs).
PRIORITY:   P1 — zero effort, potentially significant uplift
TEST:       Before/after
SUCCESS:    /free-trial/ conversion from 5.1% to 6.5%+
```

### H4: Add ROI Calculator to Main Navigation (P1)

```
PAGE:       Sitewide (nav) + /roi-calculator/
ISSUE:      ROI calculator has 14.8% key event rate (best on site) but only
            27 sessions because it's buried as a text link.
HYPOTHESIS: If we add "ROI Calculator" as a visible nav item (or a
            persistent button/banner), then calculator sessions will
            increase 5–10× and downstream conversions will follow, because
            the calculator already converts at nearly 3× the site average.
PRIORITY:   P1 — simple nav change × proven conversion asset
TEST:       Before/after (measure calculator sessions + downstream events)
SUCCESS:    ROI calculator sessions from 27 to 150+ per period
```

### H5: Homepage — Add Specific Social Proof Numbers (P1)

```
PAGE:       /
ISSUE:      Trust signals are limited to 4 partner logos and 1 case study.
            No customer count, no aggregate metrics, no review scores.
            "Hundreds of brands" (on /free-trial/) is vague.
HYPOTHESIS: If we add concrete social proof — e.g., "247 brands have
            scanned 1,400+ markets" (or whatever the real numbers are) —
            above the fold, then engagement rate will increase from 72.2%
            to 80%+ and key event rate from 8.2% to 12%+, because specific
            numbers activate social proof more powerfully than vague claims
            (Cialdini, Influence, 2021 — specificity = credibility).
PRIORITY:   P1 — copy change only × significant trust impact
TEST:       Before/after
SUCCESS:    Homepage engagement rate >80%, key event rate >12%
```

### H6: Pricing Page Rebuild (P2)

```
PAGE:       /pricing/
ISSUE:      33.3% engagement rate. Tiers are confusing, credits are opaque,
            no free tier is visible, and there's no self-serve purchase path.
            The page actively harms the funnel.
HYPOTHESIS: If we rebuild the pricing page with: (a) a visible Free tier,
            (b) 3 tiers max with clear "good for [persona]" labels,
            (c) a "What's in a credit?" explainer with sample scan output,
            (d) an annual vs monthly toggle showing savings, and
            (e) a "Start free" CTA on the free tier, then engagement will
            increase from 33.3% to 70%+ and the page will contribute to
            free trial signups, because pricing clarity is the #1 driver
            of SaaS conversion (ProfitWell Price Intelligently study, 2023:
            clear pricing pages convert 2–3× higher than opaque ones).
PRIORITY:   P2 — high impact but requires design + dev
TEST:       Before/after (page too low-traffic for A/B)
SUCCESS:    Pricing engagement >70%, pricing → free trial flow established
```

### H7: Dedicated Google Ads Landing Page (P2)

```
PAGE:       /lp/market-intelligence/ (new)
ISSUE:      Google Ads traffic (295 sessions, 10.2% key event rate) lands on
            the homepage. No message match, no dedicated conversion path.
HYPOTHESIS: If we create a dedicated landing page matching Google Ads
            headlines (e.g., "AI Market Intelligence for UK Brands") with
            a single CTA (free trial), minimal navigation, and <1.5s LCP,
            then paid traffic conversion will increase from 10.2% key event
            rate to 15%+, because message match between ad and landing page
            improves conversion by 25–50% (Unbounce, 2024) and removing
            navigation prevents leakage.
PRIORITY:   P2 — requires new page build, but Google Ads is best-converting channel
TEST:       A/B (send 50% of ad traffic to new page vs homepage)
SUCCESS:    Google Ads key event rate from 10.2% to 15%+
```

### H8: Dedicated Meta Ads Landing Page (P2)

```
PAGE:       /lp/free-scan/ (new)
ISSUE:      Meta traffic (321 sessions) lands on /free-trial/ which has
            sitewide navigation, competing CTAs, and 20.6s mobile LCP.
            Meta traffic is predominantly mobile.
HYPOTHESIS: If we create a stripped-down mobile-first landing page with
            <1.5s LCP, one form field (email), social proof, and a sample
            scan preview, then Meta conversion will increase from 5.9% to
            10%+, because mobile page speed directly correlates with
            conversion (Google: 53% of mobile users abandon pages taking
            >3s to load; every 1s improvement = 7% conversion lift).
PRIORITY:   P2 — requires new page build + mobile performance work
TEST:       A/B (redirect 50% of Meta traffic)
SUCCESS:    Meta key event rate from 5.9% to 10%+, mobile LCP <1.5s
```

### H9: Free Trial — Instant Value Delivery (P2)

```
PAGE:       /free-trial/ (or product)
ISSUE:      48-hour delay between signup and value delivery. User motivation
            decays exponentially after leaving the page. By the time the
            scan arrives, they may have forgotten they signed up.
HYPOTHESIS: If we deliver *something* instantly at signup — even a partial
            result, a market overview, a "your scan is processing" dashboard
            with preliminary data — then activation rate (signup → engaged
            user) will increase by 40–60%, because immediate reinforcement
            after an action strengthens the behaviour loop (Fogg Behaviour
            Model: trigger → action → reward must be immediate).
PRIORITY:   P2 — may require product involvement, but critical for retention
TEST:       Before/after activation rate measurement
SUCCESS:    Day-1 email open rate >60%, return visit within 48 hours >40%
```

### H10: Homepage — Persona-Based Routing (P3)

```
PAGE:       /
ISSUE:      All four ICP personas see identical content. A wellness brand
            founder and a luxury brand director have different objections
            and different value drivers.
HYPOTHESIS: If we add a "I'm a…" selector (or dynamic content based on
            UTM/industry) that routes visitors to persona-specific messaging
            — e.g., "For beauty & wellness brands: Navigate regulatory
            complexity across 27 markets" — then homepage-to-conversion
            will increase by 20–30%, because personalised CTAs convert
            202% better than generic ones (HubSpot, 2023).
PRIORITY:   P3 — requires dynamic content implementation
TEST:       A/B with persona segments
SUCCESS:    Homepage key event rate from 8.2% to 12%+
```

### H11: Multiple Case Studies by ICP (P3)

```
PAGE:       /case-study/ (expand to /case-studies/)
ISSUE:      Single case study (health supplements) doesn't match any of the
            four ICP personas. 30 sessions and limited social proof value.
HYPOTHESIS: If we publish 3–4 case studies matching each ICP (homeware,
            wellness/beauty, luxury, scaling SME) and feature them on
            relevant pages, then trust scores will increase and conversion
            will improve by 10–15% on pages where they appear, because
            "people like me" social proof is the strongest form of social
            validation (Cialdini, 2021).
PRIORITY:   P3 — requires customer interviews and content production
TEST:       Before/after on pages where case studies are added
SUCCESS:    Case study page sessions >100/period, cited as factor in deal stage
```

### H12: Reverse Trial / Self-Serve Upgrade Path (P3)

```
PAGE:       Product + /pricing/
ISSUE:      The freemium model has no self-serve conversion path. Users
            cannot upgrade without talking to sales. This caps conversion
            at the sales team's capacity.
HYPOTHESIS: If we implement a self-serve upgrade flow (Stripe checkout
            from within the product or from /pricing/), then freemium-to-paid
            conversion will reach 2–5% within 90 days, because removing
            human gates from the purchase path is the defining characteristic
            of product-led growth (OpenView PLG benchmarks, 2024: self-serve
            paths convert 3× higher than sales-gated paths at <$500/mo price points).
PRIORITY:   P3 — requires product + billing infrastructure
TEST:       Funnel analysis post-implementation
SUCCESS:    Self-serve upgrades contributing >30% of paid conversions
```

---

## PART 4: Prioritised Action Plan

### Wave 1: Quick Wins (Week 1–2)
**No dev required. Copy, CTA, and configuration changes only.**
**Target: 0.68% → 2% session-to-signup rate.**

| # | Action | Page | Effort | Expected Impact |
|---|--------|------|--------|-----------------|
| 1 | **Swap primary CTA** from "Book a demo" to "Start free — no card required" in hero + nav | / | 1 hour | +80% traffic to /free-trial/ |
| 2 | **Remove "Book a demo" CTA** from /free-trial/ page body (keep in nav only) | /free-trial/ | 30 min | +15–25% form submissions |
| 3 | **Add sample scan screenshot/PDF** above the fold on /free-trial/ | /free-trial/ | 2 hours (design asset) | +50–100% on-page conversion |
| 4 | **Add ROI Calculator to main nav** as a visible button or menu item | Sitewide | 30 min | 5–10× calculator traffic |
| 5 | **Replace "Hundreds of brands" with specific numbers** (e.g., "247 brands, 1,400 markets scanned") | / + /free-trial/ | 30 min | +10% engagement rate |
| 6 | **Rewrite /free-trial/ headline** from "TRY ROVE FOR FREE" to "See exactly where your brand should expand next — free market scan, no card required" | /free-trial/ | 15 min | Clarity improvement |
| 7 | **Add urgency element** to /free-trial/: "Your free scan results delivered within 48 hours" with a visual countdown or progress indicator | /free-trial/ | 1 hour | +5–10% conversion (urgency trigger) |
| 8 | **Add founder credentials to homepage hero** — "Built by the team behind Smoothskin ($150M, 70 markets) and CAT Phones ($85M, 60 countries)" | / | 15 min | Trust uplift |
| 9 | **Remove "Stay tuned" from webinars page** — either hide upcoming section or add a real date | /webinars/ | 15 min | Stops signalling inactivity |
| 10 | **Add testimonial quote to /free-trial/** from Alex Pitt (de Faire) directly next to the signup form | /free-trial/ | 30 min | Social proof at point of conversion |

**Wave 1 estimated total effort:** 6–8 hours of implementation (Head of Growth can do this directly in Webflow/WordPress)

---

### Wave 2: Structural Changes (Week 3–6)
**Requires Rocket agency and/or dev support.**
**Target: 2% → 4–5% session-to-signup rate.**

| # | Action | Page | Effort | Expected Impact |
|---|--------|------|--------|-----------------|
| 1 | **Fix mobile LCP** — target <1.5s across all pages. Image compression, lazy loading, critical CSS inlining, font subsetting. | Sitewide | 1–2 weeks | Unlocks mobile paid traffic |
| 2 | **Build dedicated Google Ads landing page** (/lp/market-intelligence/) — message-matched, single CTA, no nav, <1.5s LCP | New page | 1 week | +50% Google Ads conversion |
| 3 | **Build dedicated Meta Ads landing page** (/lp/free-scan/) — mobile-first, single form field, sample scan preview | New page | 1 week | +70% Meta conversion |
| 4 | **Rebuild pricing page** — visible free tier, 3 tiers max, "What's in a credit?" explainer, persona labels, self-serve CTA | /pricing/ | 1–2 weeks | Engagement from 33% to 70%+ |
| 5 | **Implement instant confirmation flow** — after free trial signup, show a "Your scan is processing" page with: (a) expected delivery time, (b) sample report preview, (c) "While you wait" content, (d) calendar link to book onboarding | /free-trial/ (post-submit) | 3–5 days | +40% activation rate |
| 6 | **Replace Contact Form 7** with a modern form tool (Typeform, HubSpot form, or custom) with inline validation, auto-fill, and progressive profiling | /free-trial/ | 3–5 days | -20% form abandonment |
| 7 | **Embed Calendly/Chilipiper** directly on /book-a-demo/ | /book-a-demo/ | 1 day | +30% demo completion rate |
| 8 | **Promote ROI calculator** — add as a sticky banner, exit-intent popup, or mid-page CTA block on homepage | / | 2–3 days | 5× calculator usage |

**Wave 2 estimated total effort:** 4–6 weeks (Rocket agency sprint)

---

### Wave 3: Advanced Optimisation (Week 7–12)
**Requires product, dev, and content investment.**
**Target: 4–5% → 6–8% session-to-signup rate.**

| # | Action | Page | Effort | Expected Impact |
|---|--------|------|--------|-----------------|
| 1 | **Persona-based dynamic content** — route visitors by industry/role to tailored messaging (UTM or self-select) | / | 2–3 weeks | +20–30% homepage conversion |
| 2 | **Publish 3+ ICP-matched case studies** — homeware, beauty/wellness, luxury, general scaling | /case-studies/ | 4–6 weeks (interviews + production) | Trust multiplier across site |
| 3 | **Implement self-serve upgrade path** — Stripe checkout from product dashboard, remove sales gate for Pro tier | Product + /pricing/ | 4–6 weeks | 3× conversion rate at <£500/mo |
| 4 | **Build content engine** — 2 blog posts/week targeting export/expansion long-tail keywords | /blog/ | Ongoing | 3–5× organic traffic within 6 months |
| 5 | **Implement behavioural email sequence** — post-signup nurture: Day 0 (confirmation + sample), Day 2 (scan results + next steps), Day 5 (case study), Day 10 (Pro upgrade offer) | Email | 2 weeks | +25% freemium-to-paid conversion |
| 6 | **Exit-intent capture** — for visitors leaving without converting, offer a "Get a free market snapshot for [your industry]" lead magnet | Sitewide | 1 week | Captures 5–10% of bouncing traffic |
| 7 | **Channel-specific retargeting** — pixel events for form-started-not-submitted, pricing-page-visited, ROI-calculator-completed | Sitewide | 1 week | Enables high-intent retargeting audiences |

---

## PART 5: Critical Finding — The Freemium Model Gap

**This deserves its own section because it's the elephant in the room.**

The entire revenue model depends on a freemium funnel: sessions → free signup → paid Pro. But the current site does not deliver a freemium experience:

| Freemium Best Practice | Rove Current State |
|------------------------|-------------------|
| Instant access to product | 48-hour wait for results |
| Self-serve signup (email → dashboard) | Lead-capture form → manual delivery |
| Free tier with ongoing value | 1 credit, single use |
| Self-serve upgrade | Sales-gated only |
| Product visible before signup | No preview, no sample, no demo video |
| Clear credit/usage model | "1 credit = 1 scan" with no context |

**Recommendation:** Before investing heavily in CRO, resolve the fundamental question: **Is Rove actually freemium, or is it a sales-led product with a free sample?**

If it's truly freemium:
- Users need instant dashboard access at signup
- The free tier needs enough credits for ongoing engagement (the 15 credits/month mentioned in the brief would work)
- Self-serve upgrade must exist
- The product must sell itself through usage

If it's sales-led with a free sample:
- Stop calling it "free trial" (implies product access)
- Call it "Free market scan" or "Get your free report"
- Optimise for demo bookings instead
- Set realistic benchmarks (2–5% for lead gen, not 8–16% for freemium)

**This decision changes the entire CRO strategy.** Everything in this audit assumes you're moving toward true freemium. If you stay sales-led, the Wave 1 and 2 actions still apply, but the benchmarks and Wave 3 actions change significantly.

---

## PART 6: Revenue Impact Modelling

Based on the brief's stated model: every 1% improvement in session-to-signup = ~8 additional signups/month = £21k+ additional Y1 revenue.

| Wave | Target Rate | Incremental Signups/Month | Incremental Y1 Revenue |
|------|------------|--------------------------|----------------------|
| Current | 0.68% | baseline (5.5/mo) | baseline |
| Wave 1 (Week 2) | 2.0% | +10.8/mo | +£28k |
| Wave 2 (Week 6) | 4.5% | +31.4/mo | +£82k |
| Wave 3 (Week 12) | 7.0% | +51.9/mo | +£136k |

**Total projected Y1 revenue uplift from CRO: £136k** (at current traffic levels, before any traffic growth from SEO/content/paid optimisation).

At the forecast 8% freemium-to-paid conversion rate, Wave 3 would deliver ~4.2 additional paying customers per month at Pro pricing.

---

## Appendix: Page Score Summary

| Page | Clarity | Urgency | Trust | Friction | Mobile | Priority |
|------|---------|---------|-------|----------|--------|----------|
| / Homepage | 5 | 3 | 5 | 7 | 3 | P1 |
| /free-trial/ | 4 | 2 | 4 | 8 | 3 | P1 |
| /book-a-demo/ | 8 | 5 | 6 | 3 | 3 | Protect |
| /pricing/ | 2 | 1 | 3 | 9 | 2 | P2 |
| /about-us/ | 7 | 1 | 7 | 4 | 5 | P3 |
| /case-study/ | 6 | 2 | 5 | 3 | 5 | P3 |
| /roi-calculator/ | 7 | 6 | 5 | 3 | 4 | P1 (promote) |
| /partners/ | 5 | 2 | 5 | 4 | 4 | Low |
| /blog/ | 4 | 1 | 3 | 2 | 5 | P3 (content) |
| /webinars/ | 3 | 1 | 4 | 3 | 5 | Low |
| Paid LPs | N/A | N/A | N/A | N/A | N/A | P2 (build) |

**Friction scale: 1 = frictionless, 10 = maximum friction. Lower is better.**
**All other scales: 1 = poor, 10 = excellent. Higher is better.**

---

## Appendix: Pricing Discrepancy Flag

The CRO brief describes: Free (15 credits/month), Pro (£225/month), Max (£675/month), Enterprise (custom).

The live site shows: Bronze (£280/month), Silver (£799/month), Gold (£1,599/month), Enterprise (custom). No free tier displayed.

**This must be resolved before the pricing page rebuild.** If the new pricing model (Free/Pro/Max) is confirmed, the Wave 2 pricing page rebuild should launch the new tiers simultaneously.

---

*End of audit. All recommendations reference GA4 data provided, industry benchmarks with sources, or established CRO principles as required by the brief constraints.*
