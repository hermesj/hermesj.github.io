# Mapping Joyce

An interactive [OpenStreetMap](https://www.openstreetmap.org/)-based map of the
places mentioned in James Joyce's *Dubliners* — a modern, self-hosted reworking
of the [Mapping Dubliners Project](https://mappingdubliners.org/).

Live: https://hermesj.github.io/mappingJoyce/

Built with the **[litmap](https://github.com/hermesj/litmap)** engine — the
generic, config-driven literary-geography engine extracted from this project.
Mapping Joyce is its reference example.

## What it shows

Three works share one map, switched via the header tabs (or
`?work=dubliners` / `?work=ulysses` / `?work=portrait`):

- **Dubliners** — 196 features across the 15 stories: 185 places and 11
  character routes, with editorial gloss + verbatim quote + page number.
- **Ulysses** *(experimental)* — an original dataset of 37 locations across
  all 18 episodes (including the dozen-plus vignettes of *Wandering Rocks*)
  plus 4 road-following journey lines (Dignam's funeral, Fr Conmee's walk, the
  viceregal cavalcade, the late walk home). Each carries the episode's clock
  time, a gloss, and where apt a quote + Gabler episode.line reference.
  Locations and times follow the published *Ulysses Map of County Dublin*
  index (factual addresses, geocoded here).
- **Portrait** (*A Portrait of the Artist as a Young Man*) *(experimental)* —
  an original dataset grouped by the novel's 5 chapters, tracing Stephen
  Dedalus from Clongowes and Bray through Belvedere, Cork and UCD to his
  departure.

> The Ulysses and Portrait layers are flagged **experimental** in the UI
> (a badge on the tab + a note in the tagline): the datasets are still
> incomplete and their quotes/references are not yet finally verified. The
> Dubliners layer is the stable one.

Each story/episode/chapter is a colour-coded layer. In the left sidebar,
**clicking a group row expands an accordion** listing its individual places;
clicking a place flies the map there and opens its popup. The **coloured
swatch** toggles that layer's visibility on/off (and *Show all* / *Hide all*
do so globally). The map opens on the Dublin region; far-flung references
(Persia, Buenos Aires … for Dubliners; Cork for Portrait) appear when you zoom
out.

The UI is English; a German layer (`?lang=de`) exists in the code but is
currently disabled, because the literary quotes are English-only.

## Stack

- Plain HTML/CSS/JS, no build step — static GitHub Pages.
- [Leaflet](https://leafletjs.com/) 1.9 for the map.
- CARTO Positron tiles (OpenStreetMap data).
- Data as a single `data/dubliners.geojson`.

## Data provenance & licence

The geodata is **derived from the Mapping Dubliners Project by Jasmine
Mulliken, PhD**, which is published under **Creative Commons Attribution-
NonCommercial 4.0 International (CC BY-NC 4.0)**
(see the deposit at <https://works.hcommons.org/records/m5n9p-pr591>).

This project therefore:

- credits Jasmine Mulliken and the Mapping Dubliners Project on the page and in
  the data file's `metadata`;
- is **non-commercial**;
- is itself shared under CC BY-NC 4.0.

The source coordinates, glosses, and quotations come from Mulliken's original
KMZ (<https://mappingdubliners.org/files/mappingdublinersearth.kmz>). Map tiles
© OpenStreetMap contributors © CARTO.

> Out of courtesy (beyond the licence's requirements), the original author was/
> should be contacted before wider publication.

## Regenerating the data

**Dubliners** (from the original KMZ, already unpacked to `source-doc.kml`) —
an example-specific importer:

```bash
cd pipeline/example-dubliners
python3 kml_to_geojson.py source-doc.kml ../../data/dubliners.geojson
```

**Ulysses** and **Portrait** (own datasets) use the generic geocoder
`pipeline/geocode_source.py`, which is work-agnostic — it reads
`groups`/`chapters`/`episodes` + `places` from any such source file, resolves
each `geocode` query via OpenStreetMap/Nominatim (<=1 req/s), caches the
resulting `lat`/`lon` back into the source so it is never re-queried, and
rewrites the GeoJSON. Set `lat`/`lon` by hand to override geocoding.

```bash
cd pipeline
python3 geocode_source.py ../data/ulysses-source.json  ../data/ulysses.geojson
python3 geocode_source.py ../data/portrait-source.json ../data/portrait.geojson
```

Bias ambiguous geocodes to a region with `--region=S,W,N,E`
(e.g. Dublin `--region=53.0,-6.7,53.7,-6.0`).

To add a place, copy an entry in the relevant `*-source.json` and set the
group (`episode` / `group`), `name`, a `geocode` query (a real, findable
address), and optional `time` / `gloss` / `quote` / `ref`.

A source may also carry a `routes` array: each route has `from`/`to`
`[lat,lon]` endpoints and an optional `mode` — `"driving"` (default, OSRM) or
`"foot"` (BRouter, avoids motorways). The geocoder draws the line and caches it
in `coords`. Delete `coords` to re-route, or hand-edit the line (e.g. in
[uMap](https://umap.openstreetmap.fr/)) and paste the corrected `[lon,lat]`
array back into `coords`. The current Ulysses routes are first approximations
to be checked against the text.

Notes: Nominatim sometimes picks the wrong same-named street (e.g. a
"Church Street" in the wrong suburb) — sanity-check new coordinates and set
`lat`/`lon` by hand where needed. **Quotes, times and episode.line refs should
be verified against the public-domain texts before publishing** (Ulysses; and
Portrait via Gutenberg #4217). `pipeline/legacy/geocode_ulysses.py` is the
older Ulysses-only geocoder, kept for reference; `geocode_source.py` supersedes
it.

## Editing geometry in uMap (round-trip)

Export the Ulysses layer to KML, fix points/routes by hand in
[uMap](https://umap.openstreetmap.fr/), then import the edits back:

```bash
cd pipeline
# 1. export to KML (folders per episode, colours, ExtendedData for round-trip)
python3 geojson_to_kml.py ../data/ulysses.geojson ../data/ulysses.kml
# 2. … import ulysses.kml into uMap, move markers / redraw lines, export …
# 3. re-import the edited file (KML or GeoJSON) back into the source
python3 import_umap.py path/to/edited.kml ../data/ulysses-source.json
# 4. regenerate the GeoJSON the site loads
python3 geocode_source.py ../data/ulysses-source.json ../data/ulysses.geojson
```

`import_umap.py` matches features by (episode, name) and writes only the
geometry back (points → `lat`/`lon`, routes → `coords`), so glosses, quotes
and times are preserved. The export↔import cycle is geometry-lossless.

## Local preview

```bash
python3 -m http.server 8732
# open http://localhost:8732/
```

## Licensing

Three layers, three sets of terms (full details in
[`NOTICE.md`](NOTICE.md)):

- **Code** (`engine/`, `pipeline/`, `text/code/`) — **MIT** ([`LICENSE`](LICENSE)).
- **Geodata** (`data/`) — **CC BY-NC 4.0**; the Dubliners layer derives from
  Jasmine Mulliken's *Mapping Dubliners Project* (attribution required).
  See [`data/NOTICE.md`](data/NOTICE.md).
- **Source texts** (`text/raw/`) — **public domain** only
  ([`text/raw/NOTICE.md`](text/raw/NOTICE.md)).

Basemap © OpenStreetMap contributors © CARTO; coordinates/routes derive from
OpenStreetMap (ODbL). No copyrighted critical editions are reproduced.
