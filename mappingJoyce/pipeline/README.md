# pipeline/

Data-preparation scripts (plain Python 3, standard library; routing also uses
`curl`). They turn the hand-curated `data/*-source.json` into the
`data/*.geojson` the engine renders.

## The actual workflow

The `*-source.json` files are the **single source of truth**. Each place caches
its `lat`/`lon` and each route its `coords` once resolved, so re-running the
geocoder is idempotent — it re-emits the same GeoJSON without re-fetching.

To add or change something, **edit the source directly**, then regenerate:

```bash
python3 geocode_source.py ../data/<work>-source.json ../data/<work>.geojson
```

- **New place** — add an entry with its group, `name`, a findable `geocode`
  query and optional `time` / `gloss` / `quote` / `ref`. It is geocoded once and
  the result cached back.
- **Wrong coordinate** — set `lat`/`lon` by hand (overrides geocoding). This is
  how every hand-corrected marker in the live data was fixed.
- **Route** — give `from`/`to` `[lat,lon]` + a `mode` (`"driving"` → OSRM,
  `"foot"` → BRouter). For a bespoke path (e.g. a rail line) paste a `coords`
  array (`[[lon,lat],…]`, `"mode":"rail"`) and it is used as-is. The live
  Ulysses routes were all hand-corrected this way — coords pasted straight into
  the source.

Bias ambiguous geocodes to a region:
`--region=53.0,-6.7,53.7,-6.0` (Dublin; Nominatim viewbox + bounded). Routing
endpoints are the `OSRM` / `BROUTER` constants at the top of
`geocode_source.py`.

## Scripts

| Script | Purpose |
|--------|---------|
| `geocode_source.py` | source JSON → GeoJSON. Geocodes places (Nominatim), draws routes (OSRM/BRouter), caches `lat`/`lon` + `coords` back into the source. The one script the live workflow uses. |
| `check.py` | **project lint** — run before committing. Catches silent failures: orphaned annotation keys, features whose `story` matches no group (invisible), stale own layers, forgotten `add_srctext`/`add_essays` after a rebuild; `--mirror ../litmap` also reports drift of the shared artefacts. |
| `overlay.py` | shared helpers (stable feature ids, overlay load/save) used by `check.py` and `annotate-ui/`. |
| `annotate-ui/` | local stdlib web app to edit/annotate features and create new ones — see its README. |
| `example-dubliners/kml_to_geojson.py` (+ `source-doc.kml`) | converts the *Mapping Dubliners Project* KMZ into `data/dubliners.geojson`. Tied to that one source format — the worked example, not generic. |
| `example-dubliners/add_srctext.py` | pins fixed Gutenberg-#2814 link targets (`srcText`) onto the Dubliners quotes. Run after `kml_to_geojson.py`. |
| `example-dubliners/add_essays.py` | attaches the Mapping Dubliners essay back-links. Run after `add_srctext.py`. |
| `example-dubliners/rebuild.sh` | the fool-proof Dubliners rebuild: runs the three steps above **in order** (the converter wipes `srcText`/`essay`, so the enrichment steps are mandatory), then lints with `check.py`. Use this instead of the single steps. |

## legacy/

Kept for reference, **not part of the current workflow**:

- `geocode_ulysses.py` — the original Ulysses-only geocoder, superseded by
  `geocode_source.py`.
- `geojson_to_kml.py` + `import_umap.py` — a uMap round-trip (export GeoJSON →
  KML, edit in uMap, import geometry back into the source). In practice we never
  used it: corrections were pasted straight into the source `coords`/`lat`/`lon`
  instead. **To be revisited** if/when uMap editing is reworked.
