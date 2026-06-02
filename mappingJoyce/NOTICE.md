# Rights model

This repository deliberately combines layers with **different licences**.
Re-users must respect each layer separately.

| Layer | What | Licence | Details |
|-------|------|---------|---------|
| **Code** | `engine/`, `pipeline/`, `text/code/` | **MIT** | [`LICENSE`](LICENSE) |
| **Geodata** | `data/*.geojson`, `data/*-source.json` | **CC BY-NC 4.0** | [`data/NOTICE.md`](data/NOTICE.md) |
| **Source texts** | `text/raw/` | **Public domain** | [`text/raw/NOTICE.md`](text/raw/NOTICE.md) |

Cross-cutting:

- **Basemap**: tiles © OpenStreetMap contributors © CARTO.
- **Coordinates & routes**: derived from OpenStreetMap via Nominatim (geocoding)
  and OSRM / BRouter (routing) — **© OpenStreetMap contributors, ODbL**.
- **No copyrighted critical editions** are reproduced; where line numbers from
  the Gabler edition (1984) are cited, only the numbers are used (facts /
  citations are not copyrightable).

> Note on the **NonCommercial** terms: the geodata is NC because the Dubliners
> layer derives from a CC BY-NC source. A new project built on this template
> that uses only its **own** data could choose a more permissive geodata
> licence by editing `data/NOTICE.md`.
