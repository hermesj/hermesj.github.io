#!/usr/bin/env python3
"""Geocode the hand-curated Ulysses source list into a GeoJSON layer.

Reads ../data/ulysses-source.json, resolves each place's `geocode` query to
coordinates via OpenStreetMap's Nominatim service (respecting its usage
policy: a descriptive User-Agent and <=1 request/second), caches the result
back into the source file as `lat`/`lon`, and writes ../data/ulysses.geojson
with the same schema the Dubliners layer uses (story=episode title).

Run again after editing the source; already-cached entries are not re-queried.

Usage:
    python3 geocode_ulysses.py [source.json] [out.geojson]
"""
import json
import os
import sys
import time
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "data", "ulysses-source.json")
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, "..", "data", "ulysses.geojson")

NOMINATIM = "https://nominatim.openstreetmap.org/search"
UA = "mappingJoyce/1.0 (https://hermesj.github.io/mappingJoyce/ ; geocoding Ulysses landmarks)"


def geocode(query):
    params = urllib.parse.urlencode({"q": query, "format": "json", "limit": 1})
    req = urllib.request.Request(NOMINATIM + "?" + params, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.load(r)
    if not data:
        return None
    return round(float(data[0]["lat"]), 6), round(float(data[0]["lon"]), 6)


def main():
    with open(SRC, encoding="utf-8") as f:
        src = json.load(f)

    ep_title = {e["n"]: e for e in src["episodes"]}
    features = []
    changed = False

    for place in src["places"]:
        lat, lon = place.get("lat"), place.get("lon")
        if lat is None or lon is None:
            q = place.get("geocode") or place["name"]
            print(f"  geocoding: {q!r} ...", end=" ", flush=True)
            try:
                res = geocode(q)
            except Exception as e:  # network hiccup: skip, try next run
                print(f"FAILED ({e})")
                continue
            time.sleep(1.1)  # Nominatim courtesy rate limit
            if not res:
                print("no match — fix the 'geocode' query")
                continue
            lat, lon = res
            place["lat"], place["lon"] = lat, lon  # cache back
            changed = True
            print(f"{lat}, {lon}")

        ep = ep_title.get(place["episode"], {})
        props = {
            "work": "Ulysses",
            "episode": place["episode"],
            "story": ep.get("en", f"Episode {place['episode']}"),
            "episode_de": ep.get("de", ""),
            "name": place["name"],
            "kind": place.get("kind", "place"),
        }
        for k in ("gloss", "quote", "ref"):
            if place.get(k):
                props[k] = place[k]
        features.append({
            "type": "Feature",
            "properties": props,
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
        })

    if changed:  # persist newly cached coordinates
        with open(SRC, "w", encoding="utf-8") as f:
            json.dump(src, f, ensure_ascii=False, indent=2)

    fc = {
        "type": "FeatureCollection",
        "metadata": {
            "title": "Mapping Joyce — Ulysses",
            "note": "Original dataset compiled for mappingJoyce from the public-domain text of Ulysses (1922). Coordinates via OpenStreetMap/Nominatim.",
            "license": "CC BY-NC 4.0",
        },
        "features": features,
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(fc, f, ensure_ascii=False, indent=1)
    print(f"\nWrote {len(features)} features across "
          f"{len({x['properties']['episode'] for x in features})} episodes -> {OUT}")


if __name__ == "__main__":
    main()
