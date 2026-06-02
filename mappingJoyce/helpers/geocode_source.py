#!/usr/bin/env python3
"""Geocode a hand-curated place source into a GeoJSON layer (generic).

Works for any single-work source file with this shape:

    {
      "work": "Portrait",
      "groups":   [ { "n": 1, "en": "Chapter 1", "de": "Kapitel 1" }, ... ],
      "places":   [ { "group": 1, "name": "...", "geocode": "...",
                      "gloss": "...", "quote": "...", "ref": "..." }, ... ]
    }

The group-list key may be "groups", "chapters" or "episodes"; the per-place
group key may be "group" or "episode". Coordinates are resolved via
OpenStreetMap/Nominatim (<=1 req/s), cached back into the source as lat/lon,
and written to <basename>.geojson next to the source (or arg 2). The output
matches the schema the other layers use: each feature's `story` property is
the group's English title, so joyce.js groups it automatically.

Usage:
    python3 geocode_source.py ../data/portrait-source.json [../data/portrait.geojson]
"""
import json
import os
import subprocess
import sys
import time
import urllib.parse
import urllib.request

NOMINATIM = "https://nominatim.openstreetmap.org/search"
OSRM = "https://router.project-osrm.org/route/v1/driving/"
UA = "mappingJoyce/1.0 (https://hermesj.github.io/mappingJoyce/ ; geocoding Joyce landmarks)"


def geocode(query):
    params = urllib.parse.urlencode({"q": query, "format": "json", "limit": 1})
    req = urllib.request.Request(NOMINATIM + "?" + params, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.load(r)
    if not data:
        return None
    return round(float(data[0]["lat"]), 6), round(float(data[0]["lon"]), 6)


def route(frm, to):
    """Road-following [lon,lat] path between two [lat,lon] endpoints via OSRM.

    Uses curl rather than urllib: the public OSRM demo server's TLS handshake
    fails under Python's ssl here, while curl negotiates it fine.
    """
    pair = "{},{};{},{}".format(frm[1], frm[0], to[1], to[0])
    url = OSRM + pair + "?overview=full&geometries=geojson"
    out = subprocess.run(["curl", "-s", "-m", "30", "-A", UA, url],
                         capture_output=True, text=True, timeout=40)
    data = json.loads(out.stdout)
    if data.get("code") != "Ok" or not data.get("routes"):
        return None
    line = data["routes"][0]["geometry"]["coordinates"]
    return [[round(c[0], 6), round(c[1], 6)] for c in line]


def main(src_path, out_path):
    with open(src_path, encoding="utf-8") as f:
        src = json.load(f)

    groups = src.get("groups") or src.get("chapters") or src.get("episodes") or []
    by_n = {g["n"]: g for g in groups}
    work = src.get("work", "")
    features = []
    changed = False

    for place in src["places"]:
        lat, lon = place.get("lat"), place.get("lon")
        if lat is None or lon is None:
            q = place.get("geocode") or place["name"]
            print(f"  geocoding: {q!r} ...", end=" ", flush=True)
            try:
                res = geocode(q)
            except Exception as e:
                print(f"FAILED ({e})")
                continue
            time.sleep(1.1)  # Nominatim courtesy rate limit
            if not res:
                print("no match — fix the 'geocode' query")
                continue
            lat, lon = res
            place["lat"], place["lon"] = lat, lon
            changed = True
            print(f"{lat}, {lon}")

        gn = place.get("group", place.get("episode"))
        g = by_n.get(gn, {})
        props = {
            "work": work,
            "group": gn,
            "story": g.get("en", str(gn)),
            "group_de": g.get("de", ""),
            "name": place["name"],
            "kind": place.get("kind", "place"),
        }
        for k in ("time", "gloss", "quote", "ref"):
            if place.get(k):
                props[k] = place[k]
        features.append({
            "type": "Feature",
            "properties": props,
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
        })

    # Optional road-following routes (LineStrings) between [lat,lon] endpoints.
    for r in src.get("routes", []):
        coords = r.get("coords")
        if not coords:
            print(f"  routing: {r['name']!r} ...", end=" ", flush=True)
            try:
                coords = route(r["from"], r["to"])
            except Exception as e:
                print(f"FAILED ({e})")
                continue
            time.sleep(1.1)  # courtesy rate limit
            if not coords:
                print("no route — check the endpoints")
                continue
            r["coords"] = coords
            changed = True
            print(f"{len(coords)} points")

        gn = r.get("group", r.get("episode"))
        g = by_n.get(gn, {})
        props = {
            "work": work, "group": gn, "story": g.get("en", str(gn)),
            "group_de": g.get("de", ""), "name": r["name"], "kind": "route",
        }
        for k in ("time", "gloss", "quote", "ref"):
            if r.get(k):
                props[k] = r[k]
        features.append({
            "type": "Feature",
            "properties": props,
            "geometry": {"type": "LineString", "coordinates": coords},
        })

    if changed:
        with open(src_path, "w", encoding="utf-8") as f:
            json.dump(src, f, ensure_ascii=False, indent=2)

    fc = {
        "type": "FeatureCollection",
        "metadata": {
            "title": "Mapping Joyce — " + work,
            "note": "Original dataset compiled for mappingJoyce from the public-domain text. Coordinates via OpenStreetMap/Nominatim.",
            "license": "CC BY-NC 4.0",
        },
        "features": features,
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(fc, f, ensure_ascii=False, indent=1)
    ngroups = len({x["properties"]["group"] for x in features})
    print(f"\nWrote {len(features)} features across {ngroups} groups -> {out_path}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("usage: geocode_source.py <source.json> [out.geojson]")
    src = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.splitext(src)[0].replace("-source", "") + ".geojson"
    main(src, out)
