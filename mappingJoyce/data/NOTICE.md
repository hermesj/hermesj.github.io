# Geodata — licences & attribution

All geodata in this folder (`*.geojson` and the editable `*-source.json`) is
licensed **Creative Commons Attribution-NonCommercial 4.0 International
(CC BY-NC 4.0)** — <https://creativecommons.org/licenses/by-nc/4.0/>.

## Per work

- **`dubliners.geojson`** (built from Mulliken's KMZ via
  `pipeline/example-dubliners/`) — **Derived from** the *Mapping Dubliners
  Project* by Jasmine Mulliken, PhD
  (<https://mappingdubliners.org/>; deposit
  <https://works.hcommons.org/records/m5n9p-pr591>), which is itself published
  under CC BY-NC 4.0. **Attribution to Jasmine Mulliken is required**;
  non-commercial use only. Dr Mulliken gave her express permission for this
  reuse, with our thanks; in return, every mapped place/route links back to her
  per-place essay on Mapping Dubliners (see `docs/essay-links.md` for the
  mapping).

- **`ulysses.geojson` / `ulysses-source.json`** — Original dataset compiled for
  this project from the **public-domain text of *Ulysses* (1922)**. Factual
  locations and clock-times were informed by the published *Ulysses Map of
  County Dublin* index; facts (addresses, episode assignments, times) are not
  copyrightable and this compilation is our own. CC BY-NC 4.0.

- **`portrait.geojson` / `portrait-source.json`** — Original dataset compiled
  from the **public-domain text of *A Portrait of the Artist as a Young Man*
  (1916)** (Gutenberg #4217). CC BY-NC 4.0.

## Sources of coordinates & routes

Coordinates were initially obtained by geocoding via
**OpenStreetMap / Nominatim**, and routes initially drawn with **OSRM**
(driving) and **BRouter** (foot). Many were then **corrected or placed by hand**
on the OpenStreetMap basemap — moving a marker to the exact spot, or redrawing a
walking route along the real path. Whether geocoded or hand-placed, all
coordinates and routes derive from **OpenStreetMap data, © OpenStreetMap
contributors, licensed under the Open Database License (ODbL)** —
<https://www.openstreetmap.org/copyright>.

The **Gabler critical edition (1984)** is not used; `ref` fields cite its line
numbers only (e.g. `8.732`) as locators.
