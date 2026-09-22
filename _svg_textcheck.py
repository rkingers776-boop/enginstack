# -*- coding: utf-8 -*-
"""
SVG text overlap / overflow auditor for static HTML guides.

Parses TrueType fonts (cmap + hmtx + hhea) to compute real advance widths,
then measures every <text> node inside each <svg> and reports:
  1) text-vs-text overlaps (bounding boxes intersect)
  2) text escaping the svg viewBox (left / right / top / bottom)

Usage:  python _svg_textcheck.py <file.html> [...]
"""
import re
import struct
import sys
import os

# Windows consoles default to GBK/cp936: printing U+2212 or any non-GBK glyph
# would abort the whole run.  Never let an encoding error kill an audit.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

FONT_DIR = r"C:\Windows\Fonts"


# --------------------------------------------------------------------------
# Minimal TrueType metrics reader
# --------------------------------------------------------------------------
class TrueTypeFont:
    def __init__(self, path):
        self.path = path
        with open(path, "rb") as fh:
            self.data = fh.read()
        d = self.data
        num_tables = struct.unpack(">H", d[4:6])[0]
        self.tables = {}
        for i in range(num_tables):
            off = 12 + i * 16
            tag = d[off:off + 4].decode("latin-1")
            o, ln = struct.unpack(">II", d[off + 8:off + 16])
            self.tables[tag] = (o, ln)

        head = self.tables["head"][0]
        self.units_per_em = struct.unpack(">H", d[head + 18:head + 20])[0]

        hhea = self.tables["hhea"][0]
        self.ascent, self.descent = struct.unpack(">hh", d[hhea + 4:hhea + 8])
        self.num_h_metrics = struct.unpack(">H", d[hhea + 34:hhea + 36])[0]

        self._read_cmap()
        self._read_hmtx()

    def _read_cmap(self):
        d = self.data
        off = self.tables["cmap"][0]
        n = struct.unpack(">H", d[off + 2:off + 4])[0]
        best = None
        for i in range(n):
            rec = off + 4 + i * 8
            pid, eid, sub = struct.unpack(">HHI", d[rec:rec + 8])
            sub_off = off + sub
            fmt = struct.unpack(">H", d[sub_off:sub_off + 2])[0]
            if fmt == 4:
                score = 2 if (pid, eid) in ((3, 1), (0, 3)) else 1
                if best is None or score > best[0]:
                    best = (score, fmt, sub_off)
        self.cmap = {}
        if best is None:
            return
        _, fmt, so = best
        if fmt == 4:
            seg_x2 = struct.unpack(">H", self.data[so + 6:so + 8])[0]
            seg = seg_x2 // 2
            end_c = struct.unpack(">%dH" % seg, self.data[so + 14:so + 14 + seg_x2])
            start_o = so + 16 + seg_x2
            start_c = struct.unpack(">%dH" % seg, self.data[start_o:start_o + seg_x2])
            delta_o = start_o + seg_x2
            deltas = struct.unpack(">%dh" % seg, self.data[delta_o:delta_o + seg_x2])
            range_o = delta_o + seg_x2
            ranges = struct.unpack(">%dH" % seg, self.data[range_o:range_o + seg_x2])
            for i in range(seg):
                for c in range(start_c[i], min(end_c[i], 0xFFFF) + 1):
                    if c == 0xFFFF:
                        continue
                    if ranges[i] == 0:
                        g = (c + deltas[i]) & 0xFFFF
                    else:
                        gi = range_o + i * 2 + ranges[i] + (c - start_c[i]) * 2
                        if gi + 2 > len(self.data):
                            continue
                        g = struct.unpack(">H", self.data[gi:gi + 2])[0]
                        if g:
                            g = (g + deltas[i]) & 0xFFFF
                    if g:
                        self.cmap[c] = g

    def _read_hmtx(self):
        d = self.data
        off = self.tables["hmtx"][0]
        self.widths = []
        for i in range(self.num_h_metrics):
            w = struct.unpack(">H", d[off + i * 4:off + i * 4 + 2])[0]
            self.widths.append(w)
        self.last_width = self.widths[-1] if self.widths else 0

    def advance(self, ch):
        g = self.cmap.get(ord(ch))
        if g is None:
            return self.units_per_em * 0.5
        if g < len(self.widths):
            return self.widths[g]
        return self.last_width

    def text_width(self, s, size):
        total = sum(self.advance(c) for c in s)
        return total * size / self.units_per_em


_cache = {}


def font_for(family, weight):
    bold = False
    try:
        bold = int(weight) >= 600
    except (TypeError, ValueError):
        bold = str(weight).lower() == "bold"
    mono = "monospace" in (family or "")
    if mono:
        name = "consolab.ttf" if bold else "consola.ttf"
    else:
        name = "segoeuib.ttf" if bold else "segoeui.ttf"
    key = name
    if key not in _cache:
        path = os.path.join(FONT_DIR, name)
        if not os.path.exists(path):
            path = os.path.join(FONT_DIR, "arialbd.ttf" if bold else "arial.ttf")
        _cache[key] = TrueTypeFont(path)
    return _cache[key]


# --------------------------------------------------------------------------
# SVG text extraction + measurement
# --------------------------------------------------------------------------
TEXT_RE = re.compile(r"<text\b([^>]*)>(.*?)</text>", re.S)
ATTR_RE = re.compile(r'([\w:-]+)\s*=\s*"([^"]*)"')
SVG_RE = re.compile(r"<svg\b([^>]*)>(.*?)</svg>", re.S)
RECT_RE = re.compile(r"<rect\b([^>]*)/?>")
# document-order tokens: <g ...>, </g>, <text ...>...</text>
# group attributes (<g font-size="14.5" text-anchor="middle">) are inheritable and
# MUST be merged into the nested <text>, otherwise every measurement is wrong.
TOKEN_RE = re.compile(r"<g\b([^>]*)>|</g\s*>|<text\b([^>]*)>(.*?)</text>", re.S)
INHERITED = ("font-size", "font-family", "font-weight", "text-anchor", "letter-spacing")
NEAR = 3.0          # px: report text pairs closer than this
HIDDEN_FRACTION = 0.30   # fraction of a text bbox covered by a later opaque rect


def attr(attrs, name, default=None):
    v = attrs.get(name)
    return default if v is None else v


def analyze(path):
    with open(path, encoding="utf-8") as fh:
        html = fh.read()
    reports = []
    for si, m in enumerate(SVG_RE.finditer(html)):
        svg_attrs = dict(ATTR_RE.findall(m.group(1)))
        vb = svg_attrs.get("viewBox", "0 0 700 400").split()
        vw, vh = float(vb[2]), float(vb[3])
        body = m.group(2)
        offset = m.start(2)

        # walk in document order so <g font-size=...> style is inherited by <text>
        items = []
        stack = []
        skipped = 0
        for tm in TOKEN_RE.finditer(body):
            if tm.group(2) is not None:                 # <text ...>...</text>
                a = {}
                for d in stack:
                    a.update(d)
                a.update(dict(ATTR_RE.findall(tm.group(2))))
                if "x" not in a or "y" not in a or "transform" in a:
                    skipped += 1
                    continue
                raw = re.sub(r"<[^>]+>", "", tm.group(3))
                raw = (raw.replace("&amp;", "&").replace("&lt;", "<")
                          .replace("&gt;", ">").replace("&quot;", '"')
                          .replace("&#39;", "'").replace("&nbsp;", " "))
                raw = raw.strip()
                if not raw:
                    continue
                size = float(attr(a, "font-size", "16").replace("px", ""))
                family = attr(a, "font-family", "system-ui, sans-serif")
                weight = attr(a, "font-weight", "400")
                anchor = attr(a, "text-anchor", "start")
                f = font_for(family, weight)
                w = f.text_width(raw, size)
                x = float(a["x"])
                y = float(a["y"])
                if anchor == "middle":
                    x0 = x - w / 2.0
                elif anchor == "end":
                    x0 = x - w
                else:
                    x0 = x
                top = y - f.ascent * size / f.units_per_em
                bottom = y - f.descent * size / f.units_per_em
                line = html[:offset + tm.start()].count("\n") + 1
                items.append({
                    "text": raw, "x0": x0, "x1": x0 + w, "top": top, "bottom": bottom,
                    "y": y, "size": size, "line": line, "anchor": anchor, "x": x,
                    "family": family, "weight": weight, "pos": tm.start(),
                })
            elif tm.group(1) is not None:               # <g ...>  or  <g ... />
                ga = dict(ATTR_RE.findall(tm.group(1)))
                if not tm.group(1).rstrip().endswith("/"):
                    stack.append({k: v for k, v in ga.items() if k in INHERITED})
            else:                                        # </g>
                if stack:
                    stack.pop()

        # opaque rects, for the "text drawn behind a later box" check
        rects = []
        for rm in RECT_RE.finditer(body):
            a = dict(ATTR_RE.findall(rm.group(1)))
            if "x" not in a or "y" not in a:
                continue
            fill = a.get("fill", "#000")
            if fill in ("none", "transparent"):
                continue
            try:
                op = float(a.get("fill-opacity", a.get("opacity", "1")))
            except ValueError:
                op = 1.0
            if op < 0.5:
                continue
            try:
                rx, ry = float(a["x"]), float(a["y"])
                rw, rh = float(a.get("width", "0")), float(a.get("height", "0"))
            except ValueError:
                continue
            if rw * rh > 0.35 * vw * vh:      # canvas-sized backgrounds don't count
                continue
            rects.append({"x0": rx, "y0": ry, "x1": rx + rw, "y1": ry + rh,
                          "pos": rm.start(), "fill": fill})

        problems = []
        for i in range(len(items)):
            for j in range(i + 1, len(items)):
                a, b = items[i], items[j]
                ox = min(a["x1"], b["x1"]) - max(a["x0"], b["x0"])
                oy = min(a["bottom"], b["bottom"]) - max(a["top"], b["top"])
                if ox > 1.5 and oy > 1.0:
                    problems.append(("OVERLAP", a["line"], b["line"], ox, oy, a["text"][:58], b["text"][:58]))
                elif ox > -NEAR and oy > -NEAR:
                    problems.append(("NEAR", a["line"], b["line"], ox, oy, a["text"][:58], b["text"][:58]))
        for it in items:
            area = max((it["x1"] - it["x0"]) * (it["bottom"] - it["top"]), 0.01)
            for r in rects:
                if r["pos"] < it["pos"]:      # rect drawn before the text - harmless
                    continue
                ox = min(it["x1"], r["x1"]) - max(it["x0"], r["x0"])
                oy = min(it["bottom"], r["y1"]) - max(it["top"], r["y0"])
                if ox > 0 and oy > 0 and (ox * oy) / area > HIDDEN_FRACTION:
                    problems.append(("BEHIND-BOX", it["line"], 0, (ox * oy) / area * 100.0, 0,
                                     it["text"][:58], "rect@%d fill=%s" % (r["pos"], r["fill"])))
            if it["x1"] > vw - 2:
                problems.append(("RIGHT-OUT", it["line"], 0, it["x1"] - vw, 0, it["text"][:58], ""))
            if it["x0"] < 2:
                problems.append(("LEFT-OUT", it["line"], 0, 2 - it["x0"], 0, it["text"][:58], ""))
            if it["bottom"] > vh - 1:
                problems.append(("BOTTOM-OUT", it["line"], 0, it["bottom"] - vh, 0, it["text"][:58], ""))
        reports.append((si + 1, vw, vh, items, problems))
    return reports


def main():
    verbose = "-v" in sys.argv
    summary = "-s" in sys.argv
    files = [a for a in sys.argv[1:] if not a.startswith("-")]
    grand = 0
    for path in files:
        total = 0
        hard = 0
        if not summary:
            print("=" * 78)
            print(path)
            print("=" * 78)
            html = open(path, encoding="utf-8").read()
            for tag in ("svg", "text", "tspan"):
                o = len(re.findall(r"<%s\b" % tag, html))
                c = len(re.findall(r"</%s>" % tag, html))
                if o != c:
                    hard += 1
                    print("    TAG-BALANCE  <%s> open=%d close=%d  <- malformed" % (tag, o, c))
            stray = len(re.findall(r"(?<!<)/text>", html))
            if stray:
                hard += 1
                print("    STRAY-TAG    %d literal '/text>' rendered as visible text" % stray)
        for idx, vw, vh, items, problems in analyze(path):
            if not summary:
                print("\n--- SVG #%d  viewBox %.0fx%.0f  (%d text nodes) ---" % (idx, vw, vh, len(items)))
            if verbose:
                for it in sorted(items, key=lambda z: (z["line"])):
                    print("    L%-4d x[%7.1f..%7.1f] y[%6.1f..%6.1f] %2.0fpx %-9s | %s"
                          % (it["line"], it["x0"], it["x1"], it["top"], it["bottom"],
                             it["size"], it["anchor"], it["text"][:60]))
            if not problems and not summary:
                print("    OK - no overlap, no overflow")
            for kind, l1, l2, ox, oy, t1, t2 in sorted(problems):
                total += 1
                if kind != "NEAR":
                    hard += 1
                if summary:
                    continue
                if l2:
                    print("    %-11s L%-5d L%-5d  ox=%5.1f oy=%5.1f  | %s || %s" % (kind, l1, l2, ox, oy, t1, t2))
                else:
                    print("    %-11s L%-5d        by=%5.1f         | %s || %s" % (kind, l1, ox, t1, t2))
        grand += hard
        if summary:
            stray = len(re.findall(r"(?<!<)/text>", open(path, encoding="utf-8").read()))
            print("     hard=%-4d near=%-4d strayTag=%-3d %s" % (hard, total - hard, stray, path))
        else:
            print("\n    TOTAL PROBLEMS: %d (hard %d / near-touch %d)" % (total, hard, total - hard))
    if summary:
        print("\nGRAND TOTAL HARD PROBLEMS: %d over %d files" % (grand, len(files)))


if __name__ == "__main__":
    main()
