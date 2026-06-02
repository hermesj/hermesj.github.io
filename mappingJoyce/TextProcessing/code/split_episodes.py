#!/usr/bin/env python3
"""Split the public-domain Ulysses (1922) text into its 18 episodes.

The 1922 text marks episode starts with a bracketed number line, "[ 1 ]" …
"[ 18 ]". These appear twice: first in the table of contents, then again at the
real episode openings — so we take the *second* run of 18 markers. Part markers
("— I —", "— II —", "— III —") and the bracket lines themselves are stripped
from the episode bodies.

Input:  ../raw/ulysses-1922.txt
Output: ../annotations/episodes.json  ->  [{episode, title, text}, ...]
"""
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "raw", "ulysses-1922.txt")
OUT = os.path.join(HERE, "..", "annotations", "episodes.json")

TITLES = [
    "Telemachus", "Nestor", "Proteus", "Calypso", "Lotus Eaters", "Hades",
    "Aeolus", "Lestrygonians", "Scylla and Charybdis", "Wandering Rocks",
    "Sirens", "Cyclops", "Nausicaa", "Oxen of the Sun", "Circe", "Eumaeus",
    "Ithaca", "Penelope",
]

MARK = re.compile(r"^\s*\[\s*(\d+)\s*\]\s*$")
PART = re.compile(r"^\s*—\s*[IVX]+\s*—\s*$")


def main():
    lines = open(SRC, encoding="utf-8").read().splitlines()
    marks = [i for i, l in enumerate(lines) if MARK.match(l)]
    if len(marks) < 36:
        raise SystemExit(f"expected 36 episode markers, found {len(marks)}")
    starts = marks[-18:]              # the real episode openings (2nd run)
    bounds = starts + [len(lines)]

    episodes = []
    for n in range(18):
        body = lines[bounds[n] + 1: bounds[n + 1]]
        body = [l for l in body if not MARK.match(l) and not PART.match(l)]
        text = "\n".join(body).strip("\n").strip()
        episodes.append({"episode": n + 1, "title": TITLES[n], "text": text})

    json.dump(episodes, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"Wrote {len(episodes)} episodes -> {OUT}")
    for e in episodes:
        words = len(e["text"].split())
        print(f"  {e['episode']:2d}. {e['title']:<22} {words:>6,} words  "
              f"| {e['text'][:46].replace(chr(10),' ')}…")


if __name__ == "__main__":
    main()
