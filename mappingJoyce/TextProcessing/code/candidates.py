#!/usr/bin/env python3
"""Stage 2b — derive place candidates from the NER annotation.

Reads the annotation layer (entities.json), keeps location-like labels
(GPE/LOC/FAC), aggregates them, and flags which are NOT yet mapped in
data/ulysses-source.json — a review list for deciding what to add.

Input:  ../annotations/entities.json, ../../data/ulysses-source.json
Output: ../annotations/ner_candidates.json
"""
import json
import os
import re
import unicodedata
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ENT = os.path.join(HERE, "..", "annotations", "entities.json")
SRC = os.path.join(HERE, "..", "..", "data", "ulysses-source.json")
OUT = os.path.join(HERE, "..", "annotations", "ner_candidates.json")

PLACE_LABELS = {"GPE", "LOC", "FAC"}
MIN_COUNT = 2  # ignore one-off mentions to cut noise


def norm(s):
    s = unicodedata.normalize("NFKC", s or "").replace("’", "'")
    return re.sub(r"\s+", " ", s).strip().lower()


def main():
    data = json.load(open(ENT, encoding="utf-8"))
    src = json.load(open(SRC, encoding="utf-8"))

    mapped = set()
    for p in src.get("places", []):
        mapped.add(norm(p.get("name", "")))
        mapped.add(norm(p.get("geocode", "")))
    mapped.discard("")

    def is_mapped(cand):
        nc = norm(cand)
        return any(nc and (nc in m or m in nc) for m in mapped)

    # aggregate by normalised surface form, keep a display form + episode set
    agg = defaultdict(lambda: {"count": 0, "episodes": set(), "display": None})
    for ep, ents in data["by_episode"].items():
        for e in ents:
            if e["label"] in PLACE_LABELS:
                key = norm(e["text"])
                if len(key) < 3:
                    continue
                a = agg[key]
                a["count"] += 1
                a["episodes"].add(int(ep))
                if a["display"] is None:
                    a["display"] = re.sub(r"\s+", " ", e["text"].strip())

    cands = []
    for key, a in agg.items():
        if a["count"] >= MIN_COUNT:
            cands.append({
                "text": a["display"], "count": a["count"],
                "episodes": sorted(a["episodes"]),
                "already_mapped": is_mapped(a["display"]),
            })
    cands.sort(key=lambda c: -c["count"])
    unmapped = [c for c in cands if not c["already_mapped"]]

    json.dump({"model": data.get("model"), "place_labels": sorted(PLACE_LABELS),
               "min_count": MIN_COUNT, "candidates": cands,
               "unmapped_count": len(unmapped)},
              open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    print(f"{len(cands)} place candidates (count>={MIN_COUNT}); "
          f"{len(unmapped)} not yet mapped -> {OUT}\n")
    print("Top unmapped location candidates (for review):")
    for c in unmapped[:35]:
        print(f"  {c['count']:>4}  {c['text']:<28} eps {c['episodes']}")


if __name__ == "__main__":
    main()
