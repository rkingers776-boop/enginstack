#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sync a page's FAQPage JSON-LD block to its visible .faq-q / .faq-a paragraphs.

Why this exists
---------------
_audit_full.py compares the FAQ schema against the rendered text using norm(),
which only collapses whitespace.  It performs NO character mapping, so a schema
written by hand with ASCII stand-ins (lbf-s for lbf·s, m/s2 for m/s², x for ×)
fails the audit even though it reads identically to a human.

The only reliable fix is to generate the schema FROM the visible markup, which
is what this script does.

Usage
-----
    python _sync_faq.py <file.html> [file2.html ...]

Exit codes: 0 = all synced and verified, 1 = nothing to sync or mismatch.
"""
import json
import os
import re
import sys
import textwrap

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

FAQ_BLOCK = re.compile(
    r'<script type="application/ld\+json">\s*'
    r'\{\s*"@context":\s*"https://schema\.org",\s*"@type":\s*"FAQPage".*?'
    r'\n\s*</script>',
    re.S,
)


def strip_tags(s):
    return re.sub(r"<[^>]+>", "", s)


def norm(s):
    """Mirror of _audit_full.norm(): collapse whitespace only."""
    return re.sub(r"\s+", " ", strip_tags(s)).strip()


def visible_pairs(html):
    qs = [norm(x) for x in re.findall(r'<p class="faq-q"[^>]*>(.*?)</p>', html, re.S)]
    as_ = [norm(x) for x in re.findall(r'<p class="faq-a"[^>]*>(.*?)</p>', html, re.S)]
    return qs, as_


def sync(path):
    # CRLF-safe: read raw bytes, detect the file's native line ending, process
    # with \n internally and restore it on write.  Reading with
    # open(..., encoding="utf-8") triggers universal-newline translation, and
    # writing with newline="" then writes bare \n — which silently converts a
    # CRLF file to LF.  This site is uniformly CRLF, so that is a regression.
    raw = open(path, "rb").read()
    nl = b"\r\n" if b"\r\n" in raw else b"\n"
    html = raw.decode("utf-8").replace("\r\n", "\n").replace("\r", "\n")
    qs, as_ = visible_pairs(html)

    if not qs or len(qs) != len(as_):
        print(f"  SKIP  {path}: {len(qs)} questions / {len(as_)} answers")
        return False

    m = FAQ_BLOCK.search(html)
    if not m:
        print(f"  SKIP  {path}: no FAQPage JSON-LD block")
        return False

    # re-read the block body cleanly (the regex match includes the script tags)
    body = re.sub(r"^<script[^>]*>", "", m.group(0))
    body = re.sub(r"</script>\s*$", "", body).strip()
    obj = json.loads(body)
    obj["mainEntity"] = [
        {"@type": "Question", "name": q,
         "acceptedAnswer": {"@type": "Answer", "text": a}}
        for q, a in zip(qs, as_)
    ]

    new_block = ('<script type="application/ld+json">\n'
                 + textwrap.indent(json.dumps(obj, ensure_ascii=False, indent=2), "    ")
                 + "\n    </script>")

    out = html[:m.start()] + new_block + html[m.end():]
    if nl == b"\r\n":
        out = out.replace("\n", "\r\n")
    open(path, "wb").write(out.encode("utf-8"))

    # verify exactly the way the audit does
    chk = (open(path, "rb").read().decode("utf-8")
           .replace("\r\n", "\n").replace("\r", "\n"))
    vq, va = visible_pairs(chk)
    sch = None
    for blk in re.findall(r'<script type="application/ld\+json">(.*?)</script>', chk, re.S):
        try:
            d = json.loads(blk)
        except Exception:
            continue
        if isinstance(d, dict) and d.get("@type") == "FAQPage":
            sch = d
    assert sch is not None
    sq = [q["name"] for q in sch["mainEntity"]]
    sa = [q["acceptedAnswer"]["text"] for q in sch["mainEntity"]]
    ok = (vq == sq and va == sa)
    print(f"  {'OK  ' if ok else 'FAIL'}  {path}: {len(qs)} Q/A, schema matches visible = {ok}")
    return ok


def main(argv):
    targets = argv[1:]
    if not targets:
        print(__doc__)
        return 1
    allok = True
    for t in targets:
        if not os.path.exists(t):
            print(f"  MISS  {t}")
            allok = False
            continue
        allok &= sync(t)
    return 0 if allok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
