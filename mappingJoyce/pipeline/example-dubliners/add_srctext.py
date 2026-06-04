#!/usr/bin/env python3
"""Set a fixed Gutenberg-#2814 text fragment (`srcText`) on each Dubliners quote.

The displayed quotes (from the Mapping Dubliners Project) differ slightly from
Gutenberg #2814 — commas, accents (Ségouin), "O"/"Oh" — so a fragment *generated
from the quote* sometimes fails to highlight. This locates each quote verbatim
in #2814 (matching accent/punctuation/case-insensitively) and stores the
#2814-verbatim run as `srcText`, which the engine then uses as a fixed link
target. The quotes themselves are left untouched. Word-level differences
(O/Oh, word order, word-joins) stay unmatched and fall back to the chapter
anchor.

Run AFTER kml_to_geojson.py (it post-processes the GeoJSON).
Usage:  python3 add_srctext.py ../../data/dubliners.geojson
"""
import html as _html
import json
import re
import subprocess
import sys
import unicodedata
from collections import defaultdict

URL = "https://www.gutenberg.org/cache/epub/2814/pg2814-images.html"


def fold(s):
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))   # strip accents
    s = s.replace("’", "'").lower()
    s = re.sub(r"[^a-z0-9' ]", " ", s)                          # drop commas/punct
    return re.sub(r"\s+", " ", s).strip()


def main(path):
    raw = subprocess.run(["curl", "-s", "-m", "60", "-A", "Mozilla/5.0", URL],
                         capture_output=True, text=True, timeout=90).stdout
    text = re.sub(r"\s+", " ", _html.unescape(re.sub(r"<[^>]+>", " ", raw))).strip()
    toks = [(m.group(0), m.start(), m.end()) for m in re.finditer(r"\S+", text)]
    W, S, E = [], [], []
    for w, a, b in toks:
        fw = fold(w)
        if fw:                          # keep one folded word per token (drop punct-only)
            W.append(fw.split()[0] if " " in fw else fw); S.append(a); E.append(b)
    first = defaultdict(list)
    for i, w in enumerate(W):
        first[w].append(i)

    def locate(qf):
        for L in (10, 8, 6, 5, 4):
            if len(qf) < L:
                continue
            key = qf[:L]
            for i in first.get(key[0], []):
                if W[i:i + L] == key:
                    return text[S[i]:E[i + L - 1]]
        return None

    geo = json.load(open(path, encoding="utf-8"))
    total = setn = 0
    for f in geo["features"]:
        p = f["properties"]
        if not p.get("quote") or p.get("kind") == "route":
            continue
        total += 1
        snippet = locate(fold(p["quote"]).split())
        if snippet:
            p["srcText"] = snippet
            setn += 1
        else:
            p.pop("srcText", None)
    json.dump(geo, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"srcText set on {setn}/{total} quoted places -> {path}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "../../data/dubliners.geojson")
