#!/usr/bin/env python3
"""Stage 1 — verify mapped Ulysses places & quotes against the 1922 text.

For every place in ../../data/ulysses-source.json this checks:
  * quote   — does the (normalised) quote occur in the text, and in the right
              episode? Reports the episode it is actually found in.
  * mention — do the distinctive proper-noun token(s) of the place name occur
              in its own episode?

Writes a structured report to ../annotations/verification.json and prints a
human summary highlighting anything to fix.
"""
import json
import os
import re
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "..", "data", "ulysses-source.json")
EPS = os.path.join(HERE, "..", "annotations", "episodes.json")
OUT = os.path.join(HERE, "..", "annotations", "verification.json")

# Generic words to drop when deriving a name "probe" (keep distinctive nouns).
STOP = {
    "the", "of", "by", "to", "and", "no", "st", "sir", "pub", "hotel", "house",
    "cemetery", "hospital", "office", "post", "shop", "pharmacy", "street",
    "road", "avenue", "quay", "bridge", "showgrounds", "school", "station",
    "entrance", "return", "walk", "morning", "rail", "tower", "strand",
    "church", "college", "rooms", "auction", "sweetshop", "journal",
    "telegraph", "evening", "stonybatter", "nighttown", "stephen's",
    "stephens", "cavalcade", "route", "funeral",
}


def norm(s):
    s = unicodedata.normalize("NFKC", s or "")
    s = (s.replace("’", "'").replace("‘", "'")
           .replace("“", '"').replace("”", '"')
           .replace("—", " ").replace("–", " "))
    s = re.sub(r"\s+", " ", s)
    return s.lower().strip()


def probes(name):
    out = []
    for tok in re.findall(r"[A-Za-z']+", name):
        if tok.lower() not in STOP and len(tok) > 2 and tok[0].isupper():
            out.append(tok)
    return out


def main():
    src = json.load(open(SRC, encoding="utf-8"))
    episodes = {e["episode"]: norm(e["text"]) for e in json.load(open(EPS, encoding="utf-8"))}
    book = " ".join(episodes[k] for k in sorted(episodes))

    results = []
    q_total = q_ok = q_wrong_ep = q_missing = 0
    m_total = m_ok = 0

    items = [("place", p) for p in src.get("places", [])] + \
            [("route", r) for r in src.get("routes", [])]

    for kind, it in items:
        ep = it.get("episode")
        name = it.get("name", "")
        ep_text = episodes.get(ep, "")
        rec = {"kind": kind, "episode": ep, "name": name}

        # quote check
        if it.get("quote"):
            q_total += 1
            nq = norm(it["quote"])
            in_ep = nq in ep_text
            found_eps = [k for k in sorted(episodes) if nq in episodes[k]]
            rec["quote_found_in_book"] = bool(found_eps)
            rec["quote_in_own_episode"] = in_ep
            rec["quote_found_episodes"] = found_eps
            if in_ep:
                q_ok += 1
            elif found_eps:
                q_wrong_ep += 1
            else:
                q_missing += 1

        # mention check
        pr = probes(name)
        if pr:
            m_total += 1
            hits = {p: ep_text.count(norm(p)) for p in pr}
            rec["name_probes"] = pr
            rec["name_hits_in_episode"] = hits
            rec["name_mentioned"] = any(v > 0 for v in hits.values())
            if rec["name_mentioned"]:
                m_ok += 1

        results.append(rec)

    json.dump({"summary": {
        "quotes_total": q_total, "quotes_ok": q_ok,
        "quotes_wrong_episode": q_wrong_ep, "quotes_not_found": q_missing,
        "names_total": m_total, "names_mentioned": m_ok,
    }, "items": results}, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    print(f"Quotes: {q_ok}/{q_total} verified in own episode; "
          f"{q_wrong_ep} found but in another episode; {q_missing} not found.")
    print(f"Names:  {m_ok}/{m_total} mentioned in their own episode.\n")
    print("— Quotes needing attention —")
    for r in results:
        if r.get("quote_found_in_book") is None:
            continue
        if not r.get("quote_in_own_episode"):
            where = ("found in episode(s) " + ", ".join(map(str, r["quote_found_episodes"]))
                     if r["quote_found_episodes"] else "NOT FOUND in text")
            print(f"  ✗ ep{r['episode']:>2} {r['name'][:34]:<34} {where}")
    print("\n— Names not found in their episode —")
    for r in results:
        if r.get("name_mentioned") is False:
            print(f"  ? ep{r['episode']:>2} {r['name'][:34]:<34} probes={r['name_probes']}")
    print(f"\nFull report -> {OUT}")


if __name__ == "__main__":
    main()
