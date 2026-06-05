#!/usr/bin/env python3
"""Attach Mapping Dubliners essay back-links to the Dubliners GeoJSON.

Jasmine Mulliken (mappingdubliners.org) writes a short per-place essay for many
of the locations in *Dubliners*. With her express permission we link each of our
features back to its essay. The mapping (our feature `name` -> essay URL) lives
in `essay-links.json`, hand-confirmed in `docs/essay-links.md`; here we simply
stamp an `essay` property onto every feature whose name appears there.

Matching is by name, so all story-occurrences of the same place get the link.
Idempotent and re-run-safe: run it AFTER kml_to_geojson.py (and add_srctext.py).

Usage:
    python3 add_essays.py ../../data/dubliners.geojson [essay-links.json]
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))


def main(geo_path, map_path):
    with open(map_path, encoding="utf-8") as f:
        links = json.load(f)["links"]
    with open(geo_path, encoding="utf-8") as f:
        geo = json.load(f)

    stamped, missing = 0, 0
    for feat in geo["features"]:
        url = links.get(feat["properties"]["name"])
        if url:
            feat["properties"]["essay"] = url
            stamped += 1
        elif feat["properties"].pop("essay", None) is not None:
            # name no longer in the map (e.g. corrected): drop a stale link
            missing += 1

    with open(geo_path, "w", encoding="utf-8") as f:
        json.dump(geo, f, ensure_ascii=False, indent=1)

    covered = len({f["properties"]["name"] for f in geo["features"]
                   if f["properties"].get("essay")})
    print(f"Stamped essay on {stamped} features ({covered} distinct places); "
          f"{len(geo['features']) - stamped} without an essay.")


if __name__ == "__main__":
    geo = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "..", "data", "dubliners.geojson")
    mp = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, "essay-links.json")
    main(geo, mp)
