# text

Text-driven pipelines to **verify and enrich** the mappingJoyce datasets
against Joyce's own words — from simple place/quote checking up to full
Named-Entity-Recognition (NER) annotation.

```
text/
├── raw/            public-domain source texts (+ provenance NOTICE)
├── code/           pipeline scripts (one step each, composable)
└── annotations/    generated JSON (episode splits, verification, NER candidates)
```

## Legal / provenance (important)

The only third-party content here is the **text of *Ulysses* (1922)**, which is
**public domain**:

- **US** — published 1922, i.e. before 1929 → public domain.
- **EU / Ireland** — James Joyce died 1941; life + 70 years expired on
  1 January 2012 → public domain.

We use the **1922 first-edition text** (sourced from Project Gutenberg
[#4300](https://www.gutenberg.org/ebooks/4300), which is based on that edition),
with the Project Gutenberg header/footer and all "Project Gutenberg" branding
**removed** — so what remains is plain public-domain text, freely
redistributable. See [`raw/NOTICE.md`](raw/NOTICE.md).

We do **not** use the copyrighted **Gabler critical edition (1984)**. The
`ref` fields elsewhere in the project (e.g. `8.732`) cite Gabler *line numbers*
only as a locator — numbers/citations are not themselves copyrightable, and no
Gabler text is reproduced.

Code here is original (MIT-style, same as the repo). NER uses
[spaCy](https://spacy.io/) (MIT) and its models, which are downloaded at run
time and not vendored here.

→ **This folder is safe to publish on GitHub.**

## Pipelines

| Step | Script | Output |
|------|--------|--------|
| Split into 18 episodes | `code/split_episodes.py` | `annotations/episodes.json` |
| Stage 1 — verify places & quotes | `code/verify_places.py` | `annotations/verification.json` |
| Stage 2a — full NER annotation | `code/annotate.py` | `annotations/entities.json` |
| Stage 2b — derive place candidates | `code/candidates.py` | `annotations/ner_candidates.json` |

```bash
cd text/code
python3 split_episodes.py
python3 verify_places.py
pip install spacy && python -m spacy download en_core_web_sm   # once
python3 annotate.py          # text -> full entity annotation (all labels)
python3 candidates.py        # annotation -> unmapped place candidates
```

Stage 1 checks whether each mapped place and each quote in
`../../data/ulysses-source.json` actually occurs in the right episode, and
reports mismatches to fix.

Stage 2 is split deliberately: **2a annotates** the text into a reusable layer
(`entities.json` — every entity, every label, with character offsets into the
episode texts), and **2b derives** the place-candidate review list from that
annotation rather than re-running NER. Swap the spaCy model for higher quality
(`python3 annotate.py en_core_web_lg` or `…_trf`). Joyce's stylised prose
yields false positives, so the candidate list is a suggestion set, not ground
truth — and it mixes Dublin places we have not mapped (e.g. the Coombe,
Malahide, Kingstown) with far-off references (Paris, London, Gibraltar) and
noise (e.g. "thou", person surnames).

> The annotations checked in under `annotations/` were generated with
> **`en_core_web_trf`** (not the `en_core_web_sm` of the quick-start above), and
> the episode 1–3 entities were then **hand-pruned** of obvious false positives.
> Re-running `annotate.py` with the default model will therefore differ and will
> overwrite that manual cleanup. `split_episodes.py`, `verify_places.py` and
> `candidates.py` need no model and are safe to re-run (idempotent);
> `verify_places.py` in particular should be re-run whenever
> `data/ulysses-source.json` changes, since `verification.json` is a report on
> the current dataset.
