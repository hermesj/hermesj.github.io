# Mapping Joyce

An interactive [OpenStreetMap](https://www.openstreetmap.org/)-based map of the
places in James Joyce's *Dubliners*, *Ulysses* and *A Portrait of the Artist as
a Young Man*.

- **Live:** <https://hermesj.github.io/mappingJoyce/>
- **Engine:** built on **[litmap](https://github.com/hermesj/litmap)**, the
  generic, config-driven literary-geography engine extracted from this project.
  Mapping Joyce is its reference example.

## What it shows

Three works share one map, switched via the header tabs (or
`?work=dubliners` / `?work=ulysses` / `?work=portrait`):

- **Dubliners** — 196 features across the 15 stories (185 places + 11 character
  routes).
- **Ulysses** *(experimental)* — 45 features across all 18 episodes (38 places
  + 7 journey lines).
- **Portrait** *(experimental)* — 16 places across the 5 chapters, tracing
  Stephen Dedalus from Clongowes to UCD.

Each place carries an editorial gloss and, where apt, a verbatim quotation. For
*Dubliners* and *Ulysses* the quote links **"↗ in context"** straight to the
passage in the public-domain text on Project Gutenberg (a scroll-to-text
fragment that highlights the line).

> The *Ulysses* and *Portrait* layers are flagged **experimental**; their
> still-incomplete nodes are marked *unverified yet* until checked against the
> text. *Dubliners* is the stable layer.

## Data provenance

- **Dubliners** geodata is **derived from the
  [Mapping Dubliners Project](https://mappingdubliners.org/) by Jasmine
  Mulliken, PhD** (CC BY-NC 4.0, attribution required). We're delighted that
  Dr Mulliken generously gave her blessing for this reuse — our sincere thanks.
  With her express permission, each mapped place and route links back to her
  per-place essay on Mapping Dubliners (the "📖 about this place" link in the
  popup).
- **Own additions** to the Dubliners layer (places/routes *not* from Mulliken)
  live in a separate file (`data/dubliners-own.geojson`), carry a `source: own`
  tag, and are flagged "Added by J. Hermes — not part of Mapping Dubliners"
  in their popup, so their provenance (and any mistakes) is clearly the
  author's.
- **Ulysses** and **Portrait** are **original datasets** compiled from the
  public-domain texts, geocoded via OpenStreetMap/Nominatim.
- Source quotations link to the public-domain Gutenberg texts
  (*Dubliners* #2814, *Ulysses* #4300). No copyrighted critical edition is
  reproduced.

## Features

- **Work tabs** in the header switch between the three works.
- Each story / episode / chapter is a **colour-coded, toggleable layer**
  (*Ulysses* uses Joyce's Linati palette).
- The **sidebar is an accordion**: click a group to list its places, click a
  place to fly there and open its popup; the colour swatch toggles that layer,
  and *Show all* / *Hide all* act globally.
- **Popups** show the gloss, the character(s) on the move, a clock time
  (*Ulysses*), the quote, and the Gutenberg "in context" link.
- The map opens on the Dublin region; far-flung references (Gibraltar, Cork …)
  appear as you zoom out.

## Stack

- Plain HTML/CSS/JS, **no build step** — static GitHub Pages.
- [Leaflet](https://leafletjs.com/) 1.9 with CARTO Positron tiles (OpenStreetMap
  data).
- Data as `data/*.geojson`, one file per work.
- The [litmap](https://github.com/hermesj/litmap) engine is fully
  config-driven: `config.json` (project) + `data/` (content) + `engine/`
  (generic code). See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Regenerating the data

**Dubliners** — from Mulliken's KMZ (unpacked to `source-doc.kml`). Use the
wrapper, which runs the converter **and** the two mandatory enrichment steps
(`add_srctext.py`, `add_essays.py` — the converter wipes their fields) and then
lints the result:

```bash
pipeline/example-dubliners/rebuild.sh
```

Own additions to *Dubliners* (not from Mulliken) are kept separate — edit
`data/dubliners-own-source.json`, then regenerate with the generic geocoder
(its `source: own` tag flags each feature in the popup):

```bash
cd pipeline
python3 geocode_source.py ../data/dubliners-own-source.json ../data/dubliners-own.geojson
```

**Ulysses** and **Portrait** — from the hand-editable `*-source.json`:

```bash
cd pipeline
python3 geocode_source.py ../data/ulysses-source.json  ../data/ulysses.geojson
python3 geocode_source.py ../data/portrait-source.json ../data/portrait.geojson
```

`geocode_source.py` resolves each place's `geocode` query via Nominatim
(≤1 req/s) and caches the resulting `lat`/`lon` (and route `coords`) back into
the source, so nothing is re-fetched on a re-run. Bias ambiguous geocodes with
`--region=53.0,-6.7,53.7,-6.0` (Dublin). To add a place, copy an entry in the
relevant `*-source.json` and set its group, `name`, a findable `geocode` query
and optional `time` / `gloss` / `quote` / `ref`. The data contract is
documented in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

**Annotating & sanity-checking** — editorial annotations (character, time,
ordering, corrections; also new places/routes) are edited with the local tool
`pipeline/annotate-ui/` (see its README) and stored in per-work overlay files
(`data/<work>-annotations.json`) that the engine merges at load time. Before
committing, lint the project:

```bash
python3 pipeline/check.py            # orphaned annotations, invisible features, …
```

## Local preview

```bash
python3 -m http.server 8732
# open http://localhost:8732/
```

## Licensing

Three layers, three sets of terms (full details in [`NOTICE.md`](NOTICE.md)):

- **Code** (`engine/`, `pipeline/`, `text/code/`) — **MIT**
  ([`LICENSE`](LICENSE)).
- **Geodata** (`data/`) — **CC BY-NC 4.0**; the *Dubliners* layer derives from
  Jasmine Mulliken's *Mapping Dubliners Project* (attribution required).
- **Source texts** (`text/raw/`) — **public domain**.

Basemap © OpenStreetMap contributors © CARTO; coordinates/routes derive from
OpenStreetMap (ODbL). A non-commercial academic project.
