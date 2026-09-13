# example-dubliners/ — the Mapping Dubliners conversion (project-specific)

Converts Jasmine Mulliken's *Mapping Dubliners Project* KMZ (unpacked to
`source-doc.kml`) into `data/dubliners.geojson`. Tied to that one source
format — the worked example for this project, **not** part of the generic,
synced litmap pipeline (see `../README.md` for that).

| Script | Purpose |
|--------|---------|
| `kml_to_geojson.py` (+ `source-doc.kml`) | KMZ/KML → `data/dubliners.geojson`. Wipes `srcText`/`essay`, so the two steps below are mandatory afterwards. |
| `add_srctext.py` | pins fixed Gutenberg-#2814 link targets (`srcText`) onto the Dubliners quotes. |
| `add_essays.py` (+ `essay-links.json`) | attaches the Mapping Dubliners essay back-links (`essay`). |
| `rebuild.sh` | the fool-proof rebuild: runs the three steps **in order**, then lints with `pipeline/check.py`. Use this instead of the single steps. |

Own additions to *Dubliners* live separately in `data/dubliners-own-source.json`
(rendered with the generic `geocode_source.py`), and editorial corrections in
the overlay `data/dubliners-annotations.json` — the derived base layer is never
modified. Because there is no `dubliners-source.json`, `consolidate.py` skips
this work by design; the overlay stays the place for Dubliners edits.

## legacy/

Kept for reference, **not part of the current workflow**:

- `geocode_ulysses.py` — the original Ulysses-only geocoder, superseded by
  `geocode_source.py`.
- `import_umap.py` — an earlier uMap import; the current generic
  `pipeline/import_umap.py` replaces it.
