#!/usr/bin/env python3
"""Split a plain-text work into its units (episodes / chapters / stories).

Generic + config-driven: all project-specific settings live in a split-config
JSON (default ../split-config.json), so the same script serves any text whose
units are delimited by a regex marker. See ../split-config.json for the schema.

  markerRegex  line that marks a unit start (captures the unit number)
  stripRegex   lines to drop from unit bodies (e.g. part dividers)
  markerRun    "last" | "first" | "all" — which run of markers are the real
               unit openings (Ulysses repeats them in its table of contents)
  count        number of units
  titles       unit titles (length = count)
  source/output  paths, relative to the config file

Output: a JSON list of {<unitField>, title, text}.

Usage:  python3 split_episodes.py [split-config.json]
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))


def main(cfg_path):
    cfg = json.load(open(cfg_path, encoding="utf-8"))
    base = os.path.dirname(os.path.abspath(cfg_path))
    src = os.path.join(base, cfg["source"])
    out = os.path.join(base, cfg["output"])
    mark = re.compile(cfg["markerRegex"])
    strip = re.compile(cfg["stripRegex"]) if cfg.get("stripRegex") else None
    titles = cfg["titles"]
    count = cfg.get("count", len(titles))
    field = cfg.get("unitField", "unit")

    lines = open(src, encoding="utf-8").read().splitlines()
    marks = [i for i, l in enumerate(lines) if mark.match(l)]
    run = cfg.get("markerRun", "all")
    if run == "last":
        starts = marks[-count:]
    elif run == "first":
        starts = marks[:count]
    else:
        starts = marks
    if len(starts) != count:
        raise SystemExit(f"expected {count} unit markers, found {len(starts)}")

    bounds = starts + [len(lines)]
    units = []
    for n in range(count):
        body = lines[bounds[n] + 1: bounds[n + 1]]
        body = [l for l in body if not mark.match(l) and not (strip and strip.match(l))]
        text = "\n".join(body).strip("\n").strip()
        units.append({field: n + 1, "title": titles[n], "text": text})

    json.dump(units, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"Wrote {len(units)} units -> {out}")
    for u in units:
        words = len(u["text"].split())
        print(f"  {u[field]:2d}. {u['title']:<22} {words:>6,} words  "
              f"| {u['text'][:46].replace(chr(10), ' ')}…")


if __name__ == "__main__":
    cfg = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "split-config.json")
    main(cfg)
