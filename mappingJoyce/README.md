# Mapping Joyce

An interactive [OpenStreetMap](https://www.openstreetmap.org/)-based map of the
places mentioned in James Joyce's *Dubliners* — a modern, self-hosted reworking
of the [Mapping Dubliners Project](https://mappingdubliners.org/).

Live: https://hermesj.github.io/mappingJoyce/

## What it shows

Three works share one map, switched via the header tabs (or
`?work=dubliners` / `?work=ulysses` / `?work=portrait`):

- **Dubliners** — 196 features across the 15 stories: 185 places and 11
  character routes, with editorial gloss + verbatim quote + page number.
- **Ulysses** *(experimental)* — an original, growing dataset grouped by the
  novel's 18 episodes, with gloss + quote + Gabler episode.line reference.
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

**Dubliners** (from the original KMZ, already unpacked to `source-doc.kml`):

```bash
cd helpers
python3 kml_to_geojson.py source-doc.kml ../data/dubliners.geojson
```

**Ulysses** (own dataset). Edit `data/ulysses-source.json` — add a place under
`places` with `episode`, `name`, a `geocode` query (a real, findable Dublin
landmark/street), and optional `gloss` / `quote` / `ref`. Then:

```bash
cd helpers
python3 geocode_ulysses.py
```

The geocoder resolves each new `geocode` query via OpenStreetMap/Nominatim
(<=1 req/s), caches the resulting `lat`/`lon` back into the source so it is
never re-queried, and rewrites `data/ulysses.geojson`. Set `lat`/`lon` by hand
to override geocoding. The seed covers iconic locations across 16 of the 18
episodes; episodes 10 (Wandering Rocks) and 18 (Penelope) are placeholders to
fill in. **Quotes and episode.line refs should be verified against the
public-domain text before publishing.**

**Portrait** (own dataset, grouped by chapter). Same workflow with the generic
geocoder:

```bash
cd helpers
python3 geocode_source.py ../data/portrait-source.json ../data/portrait.geojson
```

`geocode_source.py` is work-agnostic (reads `groups`/`chapters`/`episodes` +
`places` from any such source file). The Portrait seed has ~16 places across
all 5 chapters. Note that Nominatim can pick the wrong same-named street
(e.g. "Church Street") — verify new coordinates, and set `lat`/`lon` by hand
where needed. Quotes/refs likewise need checking against Gutenberg #4217.

## Local preview

```bash
python3 -m http.server 8732
# open http://localhost:8732/
```
