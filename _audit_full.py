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
    vis_q = re.findall(r'<p class="faq-q">(.*?)</p>', h, re.S)
    vis_a = re.findall(r'<p class="faq-a">(.*?)</p>', h, re.S)
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
            vis_q = re.findall(r'<p class="faq-q">(.*?)</p>', h, re.S)
            vis_a = re.findall(r'<p class="faq-a">(.*?)</p>', h, re.S)
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
