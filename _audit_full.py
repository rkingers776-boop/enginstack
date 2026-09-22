#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Deployment-readiness audit for enginstack.com (pre-deploy, local).
Modules:
  A. site-wide dead links (all html files, all internal hrefs)
  B. sitemap integrity (no dead URLs; missing pages reported)
  C. category count consistency (homepage card vs category hasPart vs actual files)
  D. new-12 pages specialized re-validation
  E. FAQ schema-vs-visible consistency (site-wide)
  F. llms.txt link validity
  G. JSON-LD parse (site-wide)
  H. HTML/typography hygiene (broken closings, unclosed <script src>, dash spacing)
  I. first-party authority claims (E-E-A-T fabrication guard) + byline uniformity
"""
import json, re, os, sys, html as htmlmod
from collections import defaultdict

ROOT = r"C:\Users\Administrator\Desktop\WB版本\enginstack项目\enginstack"
CATEGORIES = ["length","weight","temperature","speed","pressure","area","volume","time",
              "data-storage","energy","angle","torque","fuel-economy","force","frequency",
              "density","flow-rate","electric"]
errors, warnings, notes = [], [], []

def strip_tags(s):
    return htmlmod.unescape(re.sub(r'<[^>]+>', '', s)).strip()

def norm(s):
    """normalize whitespace for content-level FAQ comparison (HTML collapses
    runs of whitespace to a single space at render time)."""
    return re.sub(r'\s+', ' ', strip_tags(s)).strip()

def walk_html():
    out = []
    for dp, _, fns in os.walk(ROOT):
        if "__pycache__" in dp or ".wrangler" in dp:
            continue
        for fn in fns:
            if fn.endswith(".html"):
                out.append(os.path.join(dp, fn))
    return out

pages = walk_html()
print(f"[i] html pages found: {len(pages)}")

# ── helpers ──────────────────────────────────────────────
def resolve_target(l):
    lp = l.rstrip("/")
    if lp in ("", "/"):
        return os.path.join(ROOT, "index.html")
    if lp.endswith((".xml",".json",".svg",".png",".txt",".js",".css",".webmanifest")):
        return os.path.join(ROOT, lp.lstrip("/"))
    fp = os.path.join(ROOT, lp.lstrip("/") + ".html") if not lp.endswith(".html") else os.path.join(ROOT, lp.lstrip("/"))
    if os.path.exists(fp):
        return fp
    fp2 = os.path.join(ROOT, lp.lstrip("/"), "index.html")
    return fp2 if os.path.exists(fp2) else None

def parse_ld(h):
    return [json.loads(b) for b in re.findall(r'<script type="application/ld\+json">(.*?)</script>', h, re.S) if b.strip()]

# ── A. dead links ────────────────────────────────────────
print("\n== A. site-wide dead links ==")
dead = 0
for p in pages:
    rel = os.path.relpath(p, ROOT)
    h = open(p, encoding="utf-8").read()
    for l in set(re.findall(r'href="(/[^"#]*)"', h)):
        if resolve_target(l) is None:
            errors.append(f"A: {rel} -> dead {l}")
            dead += 1
print(f"A: {dead} dead links, {len(pages)} files scanned")

# ── B. sitemap integrity ─────────────────────────────────
print("\n== B. sitemap integrity ==")
sm = open(os.path.join(ROOT, "sitemap.xml"), encoding="utf-8-sig").read()
sm_urls = re.findall(r"<loc>(https://enginstack\.com[^<]*)</loc>", sm)
dead_sm, ok_sm = [], 0
for u in sm_urls:
    path = u.replace("https://enginstack.com", "")
    if resolve_target(path) is None:
        dead_sm.append(u)
    else:
        ok_sm += 1
if dead_sm:
    errors.append(f"B: {len(dead_sm)} sitemap URLs dead: {dead_sm[:5]}")
print(f"B: {ok_sm}/{len(sm_urls)} sitemap URLs resolve locally")
# missing pages: every html except 404 not in sitemap
in_sm = {u.replace("https://enginstack.com", "").rstrip("/") for u in sm_urls}
missing = []
for p in pages:
    rel = os.path.relpath(p, ROOT).replace("\\", "/")
    if rel == "404.html":
        continue
    slug = "/" + rel[:-5] if rel.endswith("index.html") else "/" + rel[:-5]
    slug = slug.replace("/index", "")
    if rel.endswith("index.html"):
        slug = slug.rstrip("/") + "/" if rel != "index.html" else "/"
    if slug not in in_sm and slug.rstrip("/") not in in_sm and slug + "/" not in in_sm:
        missing.append(slug)
if missing:
    notes.append(f"B: {len(missing)} pages not in sitemap (first 10): {missing[:10]}")
print(f"B: {len(missing)} pages missing from sitemap (incl. intentionally excluded)")

# ── C. category count consistency ────────────────────────
print("\n== C. category count consistency ==")
home = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
for cat in CATEGORIES:
    idx = os.path.join(ROOT, cat, "index.html")
    if not os.path.exists(idx):
        errors.append(f"C: category dir {cat} missing index.html")
        continue
    h = open(idx, encoding="utf-8").read()
    # hasPart count (WebApplication entries)
    haspart = 0
    for ld in parse_ld(h):
        if isinstance(ld, dict) and ld.get("@type") == "CollectionPage" and isinstance(ld.get("hasPart"), list):
            haspart = len(ld["hasPart"])
    # physical cards on the category page (both styles in use)
    items = len(re.findall(r'class="converter-item"', h)) + len(re.findall(r'class="category-card"', h))
    # homepage card count (match by category-title-link href, robust to card ids)
    card_m = re.search(
        r'<div class="category-card"[^>]*>(?:(?!</div>\s*</div>).)*?<a href="/%s/" class="category-title-link"(?:(?!</div>).)*?<span class="category-count">(\d+) converters?' % re.escape(cat),
        home, re.S)
    home_count = int(card_m.group(1)) if card_m else None
    # every hasPart URL must also be reachable on the category page
    missing_cards = []
    if haspart:
        # collect hrefs from both card styles (category-card blocks include
        # their reverse-direction tools in .pill links)
        item_blocks = re.findall(r'<a href="([^"]+)" class="converter-item"', h)
        for cc in re.findall(r'<div class="category-card"[^>]*>(.*?)</div>', h, re.S):
            item_blocks += re.findall(r'<a href="([^"]+)"', cc)
        item_set = set(item_blocks)
        items = len(item_set)  # unique tools covered by cards, not physical card count
        for ld in parse_ld(h):
            if isinstance(ld, dict) and ld.get("@type") == "CollectionPage":
                for hp in ld.get("hasPart", []):
                    u = hp.get("url", "")
                    slug = u.replace("https://enginstack.com", "")
                    if slug not in item_set:
                        missing_cards.append(slug)
    status = "OK" if (haspart == items and (home_count is None or home_count == haspart) and not missing_cards) else "MISMATCH"
    if status == "MISMATCH":
        errors.append(f"C: {cat}: hasPart={haspart} cards={items} home={home_count} missingCards={missing_cards}")
    print(f"C: {cat}: hasPart={haspart} cards={items} home={home_count} missingCards={len(missing_cards)} -> {status}")

# ── D. new-12 re-validation (reuse logic) ────────────────
print("\n== D. new-12 pages specialized ==")
NEW = ["ohms-to-amps","amps-to-ohms","kva-to-kw","kw-to-kva","power-factor",
       "watt-hours-to-amp-hours","amp-hours-to-watt-hours","voltage-drop",
       "btu-to-joules","joules-to-btu","mmhg-to-kpa","kpa-to-mmhg"]
EXPECT_COEFF = {"btu-to-joules.html":"1055.05585262","joules-to-btu.html":"0.0009478171203133172",
                "mmhg-to-kpa.html":"0.133322387415","kpa-to-mmhg.html":"7.500615758456563"}
for slug in NEW:
    f = slug + ".html"
    p = os.path.join(ROOT, f)
    h = open(p, encoding="utf-8").read()
    lds = parse_ld(h)
    types = [ld.get("@type") for ld in lds if isinstance(ld, dict)]
    for t in ["WebApplication","FAQPage","BreadcrumbList","Organization","DefinedTerm"]:
        if t not in types:
            errors.append(f"D: {f} missing {t}")
    faq = next((ld for ld in lds if isinstance(ld, dict) and ld.get("@type")=="FAQPage"), None)
    vis_q = re.findall(r'<p class="faq-q"[^>]*>(.*?)</p>', h, re.S)
    vis_a = re.findall(r'<p class="faq-a"[^>]*>(.*?)</p>', h, re.S)
    if faq:
        sch_q = [q["name"] for q in faq["mainEntity"]]
        sch_a = [q["acceptedAnswer"]["text"] for q in faq["mainEntity"]]
        if [strip_tags(q) for q in vis_q] != sch_q or [strip_tags(a) for a in vis_a] != sch_a:
            errors.append(f"D: {f} FAQ schema/visible mismatch")
    if f in EXPECT_COEFF:
        m = re.search(r'data-coefficient="([^"]+)"', h)
        if not m or m.group(1) != EXPECT_COEFF[f]:
            errors.append(f"D: {f} coefficient wrong")
        if "btn-swap" not in h:
            errors.append(f"D: {f} missing swap")
    for marker in ['rel="canonical"', 'hreflang="en"', 'property="og:url"', "NIST"]:
        if marker not in h:
            errors.append(f"D: {f} missing {marker}")
print(f"D: checked {len(NEW)} pages")

# ── E. FAQ site-wide consistency ─────────────────────────
print("\n== E. FAQ schema vs visible (site-wide) ==")
faq_bad = 0
for p in pages:
    rel = os.path.relpath(p, ROOT)
    h = open(p, encoding="utf-8").read()
    for ld in parse_ld(h):
        if isinstance(ld, dict) and ld.get("@type") == "FAQPage":
            vis_q = re.findall(r'<p class="faq-q"[^>]*>(.*?)</p>', h, re.S)
            vis_a = re.findall(r'<p class="faq-a"[^>]*>(.*?)</p>', h, re.S)
            sch_q = [q["name"] for q in ld["mainEntity"]]
            sch_a = [q["acceptedAnswer"]["text"] for q in ld["mainEntity"]]
            if [norm(q) for q in vis_q] != [norm(q) for q in sch_q] or [norm(a) for a in vis_a] != [norm(a) for a in sch_a]:
                faq_bad += 1
                errors.append(f"E: {rel} FAQ mismatch")
    if faq_bad == 0:
        print("E: all FAQPage schemas match visible content")
    else:
        print(f"E: {faq_bad} pages with FAQ mismatch")

# ── F. llms.txt link validity ────────────────────────────
print("\n== F. llms.txt links ==")
ll = open(os.path.join(ROOT, "llms.txt"), encoding="utf-8").read()
ll_links = re.findall(r"\[[^\]]+\]\(https://enginstack\.com([^)]+)\)", ll)
bad_ll = [u for u in ll_links if resolve_target(u) is None]
if bad_ll:
    errors.append(f"F: {len(bad_ll)} llms.txt links dead: {bad_ll[:8]}")
print(f"F: {len(ll_links)-len(bad_ll)}/{len(ll_links)} llms.txt links resolve")

# ── G. JSON-LD parse site-wide ───────────────────────────
print("\n== G. JSON-LD parse (site-wide) ==")
g_bad, type_counts = 0, defaultdict(int)
for p in pages:
    rel = os.path.relpath(p, ROOT)
    h = open(p, encoding="utf-8").read()
    for b in re.findall(r'<script type="application/ld\+json">(.*?)</script>', h, re.S):
        if not b.strip():
            continue
        try:
            ld = json.loads(b)
            type_counts[ld.get("@type")] += 1
        except Exception as e:
            g_bad += 1
            errors.append(f"G: {rel} LD parse fail: {e}")
print(f"G: {g_bad} parse failures; LD types: {dict(type_counts)}")

# ── H. markup integrity (things a regex LD check cannot see) ──
# Two silent defects found in this corpus: (1) the '<' of a closing tag was
# eaten and replaced by an em dash, so the browser renders the literal text
# "—/a>" / "—/td>" on the page; (2) <script src> left unclosed, which makes the
# parser swallow the following <script type="application/ld+json"> block
# entirely — the structured data is then never seen by crawlers.
print("\n== H. markup integrity ==")
TAGNAMES = ("a td th tr span div p text tspan svg li ul ol em strong h1 h2 h3 h4 "
            "script style nav main footer figure blockquote sup sub table thead "
            "tbody button label form input select title")
CLOSE_EATEN = re.compile(r"(?<!<)/(%s)>" % "|".join(TAGNAMES.split()))

DASH = "\u2014"


def _comment_spans(text):
    """Region ranges occupied by HTML comments, so invisible decoration is not counted."""
    spans, i = [], 0
    while True:
        a = text.find("<!--", i)
        if a < 0:
            return spans
        b = text.find("-->", a + 4)
        if b < 0:
            b = len(text)
        spans.append((a, b + 3))
        i = b + 3


def _inside(spans, pos):
    return any(a <= pos < b for a, b in spans)


broken_close, unclosed_js, dash_gap, dash_tight = [], [], [], []
for p in pages:
    rel = os.path.relpath(p, ROOT)
    h = open(p, encoding="utf-8").read()
    n = len(CLOSE_EATEN.findall(h))
    if n:
        broken_close.append((rel, n))
    if re.search(r'<script\s+src="[^"]*">\s*<script', h):
        unclosed_js.append(rel)
    if DASH in h:
        spans = _comment_spans(h)
        # A: ' —X'  the space AFTER the dash is gone ("why —the theory"). Visible prose defect.
        g = sum(1 for m in re.finditer(r"(?<=\S) " + DASH + r"(?=\S)", h)
                if not _inside(spans, m.start()))
        # B: 'X—Y'  both sides eaten ("base—0" for "base-60"). Ambiguous, needs eyes.
        t = sum(1 for m in re.finditer(r"(?<=\S)" + DASH + r"(?=\S)", h)
                if not _inside(spans, m.start()))
        if g:
            dash_gap.append((rel, g))
        if t:
            dash_tight.append((rel, t))
if broken_close:
    tot = sum(n for _, n in broken_close)
    warnings.append("H: %d pages render a literal '—/a>' style fragment: %d closings "
                    "in %s" % (len(broken_close), tot,
                               ", ".join(f"{r}({n})" for r, n in broken_close[:8])))
if unclosed_js:
    warnings.append("H: %d pages have <script src> left unclosed, which swallows the "
                    "following JSON-LD block: %s" % (len(unclosed_js), unclosed_js[:8]))
if dash_gap:
    tot = sum(n for _, n in dash_gap)
    warnings.append("H: %d pages have an em dash that ate the space after it "
                    "(e.g. 'the fix —migrating to a 64-bit time_t'): %d occurrences, "
                    "worst %s" % (len(dash_gap), tot,
                                  ", ".join(f"{r}({n})" for r, n in
                                            sorted(dash_gap, key=lambda x: -x[1])[:6])))
if dash_tight:
    tot = sum(n for _, n in dash_tight)
    notes.append("H: %d pages have an em dash with no space on either side — may be an "
                 "eaten character ('base—0' for 'base-60') or the site's tight-dash style; "
                 "review by hand: %d occurrences, worst %s"
                 % (len(dash_tight), tot,
                    ", ".join(f"{r}({n})" for r, n in
                              sorted(dash_tight, key=lambda x: -x[1])[:5])))
print(f"H: broken closings {len(broken_close)} pages; unclosed <script src> "
      f"{len(unclosed_js)} pages; dash-ate-space {len(dash_gap)} pages; "
      f"dash-tight {len(dash_tight)} pages")

# ── I. first-party authority claims (E-E-A-T fabrication guard) ──────────
# EnginStack is a solo-operated editorial site. Claiming a staffed "engineering
# team", professional licensure, standards-committee seats or a consulting
# practice is an unverifiable first-party authority claim and a real E-E-A-T
# liability. New pages are cloned from old ones, which is exactly how the old
# phrasing reached 24 attribution boxes - so this gate is checked every run.
print("\n== I. first-party authority claims ==")

CLAIM_PATTERNS = [
    # must be SELF-IDENTIFYING forms only. Bare "engineering team" and bare
    # "practicing engineers" appear legitimately in article prose about third
    # parties ("which engineering team wrote the purchase order") and about the
    # reader ("lessons for practicing engineers"), so they are NOT listed here.
    r"EnginStack\s+(?:Editorial\s*(?:&amp;|&|and)\s*)?Engineering\s+Team",
    r"engineering team at EnginStack",
    r"EnginStack engineering team",
    r"cross-disciplinary group",
    r"our (?:contributors|team members) have backgrounds",
    r"our team includes contributors",
    r"verified by an engineering team",
    r"built by engineers who use these conversions",
    r"Verified by engineers",
    r"professional engineering licensure",
    r"active professional engineering",
    r"served on industry standards committees",
    r"\d+\+? years (?:of|in) engineering",
    r"supported by its team members",
    r"consulting inquiries",
]
CLAIM_RE = re.compile("|".join("(?:%s)" % p for p in CLAIM_PATTERNS), re.I)

claim_pages = defaultdict(list)
author_names = defaultdict(int)
for p in pages:
    rel = os.path.relpath(p, ROOT)
    h = open(p, encoding="utf-8", errors="replace").read()
    seen = set()
    for m in CLAIM_RE.finditer(h):
        frag = re.sub(r"\s+", " ", strip_tags(h[max(0, m.start() - 60):m.end() + 60]))
        seen.add((m.group(0).lower(), frag[:110]))
    for key, frag in seen:
        claim_pages[rel].append((key, frag))
    am = re.search(r'class="author-name"[^>]*>([^<]*)<', h)
    if am:
        author_names[am.group(1).strip()] += 1

if claim_pages:
    total = sum(len(v) for v in claim_pages.values())
    warnings.append("I: %d pages carry %d unverifiable first-party authority claims "
                    "(staffed engineering team / licensure / consulting); worst %s"
                    % (len(claim_pages), total,
                       ", ".join("%s(%d)" % (r.replace("\\", "/"), len(v))
                                 for r, v in sorted(claim_pages.items(),
                                                    key=lambda x: -len(x[1]))[:6])))
    for rel, items in sorted(claim_pages.items(), key=lambda x: -len(x[1]))[:4]:
        for key, frag in items[:3]:
            print("   ! %-46s [%s] %s" % (rel.replace("\\", "/"), key, frag))

if len(author_names) > 1:
    warnings.append("I: byline author-name is not uniform across the site: %s"
                    % ", ".join("%r x%d" % (k, v) for k, v in
                                sorted(author_names.items(), key=lambda x: -x[1])))

print("I: pages with authority claims %d; distinct byline author-names %d %s"
      % (len(claim_pages), len(author_names),
         dict(author_names) if len(author_names) > 1 else ""))

# ── summary ──────────────────────────────────────────────
print("\n==== AUDIT SUMMARY ====")
print(f"errors: {len(errors)}")
for e in errors[:40]:
    print("  E:", e)
print(f"warnings: {len(warnings)}")
for w in warnings[:20]:
    print("  W:", w)
print(f"notes: {len(notes)}")
for n in notes[:20]:
    print("  N:", n)
sys.exit(1 if errors else 0)
