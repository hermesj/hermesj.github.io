#!/usr/bin/env python3
"""Stage 2a — full NER annotation of Ulysses.

Runs spaCy over every episode and records *all* named entities (every label,
not just places) with their character offsets, as a reusable annotation layer.
Downstream steps (e.g. candidates.py) read this JSON instead of re-running NER.

Requires:  pip install spacy && python -m spacy download en_core_web_sm
Input:     ../annotations/episodes.json
Output:    ../annotations/entities.json
"""
import json
import os
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
EPS = os.path.join(HERE, "..", "annotations", "episodes.json")
OUT = os.path.join(HERE, "..", "annotations", "entities.json")


def main(model="en_core_web_sm"):
    try:
        import spacy
    except ImportError:
        sys.exit("spaCy not installed. Run:\n"
                 "  pip install spacy && python -m spacy download en_core_web_sm")
    try:
        nlp = spacy.load(model, disable=["lemmatizer"])
    except OSError:
        sys.exit(f"model {model!r} missing. Run: python -m spacy download {model}")

    episodes = json.load(open(EPS, encoding="utf-8"))
    nlp.max_length = max(len(e["text"]) for e in episodes) + 1000

    by_episode = {}
    label_counts = Counter()
    total = 0
    for e in episodes:
        doc = nlp(e["text"])
        ents = []
        for ent in doc.ents:
            ents.append({
                "label": ent.label_,
                "text": ent.text,
                "start": ent.start_char,
                "end": ent.end_char,
            })
            label_counts[ent.label_] += 1
        by_episode[str(e["episode"])] = ents
        total += len(ents)
        print(f"  ep{e['episode']:>2} {e['title']:<22} {len(ents):>5} entities")

    out = {
        "model": model,
        "entity_count": total,
        "label_counts": dict(label_counts.most_common()),
        "note": "Offsets are character positions into the matching episode text "
                "in episodes.json. Auto-generated NER over the public-domain 1922 "
                "text; expect false positives in Joyce's stylised prose.",
        "by_episode": by_episode,
    }
    json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"\nWrote {total} entities ({len(label_counts)} labels) -> {OUT}")
    print("Labels:", ", ".join(f"{k}={v}" for k, v in label_counts.most_common()))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "en_core_web_sm")
