#!/usr/bin/env python3
"""Convert the Mapping Dubliners Project KMZ into a clean GeoJSON FeatureCollection.

Source data: "Mapping Dubliners Project" by Jasmine Mulliken, PhD,
licensed CC BY-NC 4.0 (https://works.hcommons.org/records/m5n9p-pr591).
Original KMZ: https://mappingdubliners.org/files/mappingdublinersearth.kmz

The KML groups placemarks into 15 folders, one per story of Joyce's
*Dubliners*. Each placemark carries a CDATA <description> of the form:

    "Story Title"<br>[a short gloss]<br><br>"a verbatim Joyce quote" (42).<br>

We split that into structured properties (gloss, quote, page) that the engine
actually reads; the leading story-label and the raw description blob are parsed
only to drive that split and are not emitted (the engine never read them).
Geometry is either a Point (a place) or a LineString (a character's route).

Usage:
    python3 kml_to_geojson.py path/to/doc.kml ../data/dubliners.geojson
"""
import html as _html
import json
import re
import sys
import xml.etree.ElementTree as ET

NS = {"k": "http://www.opengis.net/kml/2.2"}


def text_of(el, tag):
    child = el.find(f"k:{tag}", NS)
    return child.text if child is not None and child.text else ""


def parse_coords(raw):
    """KML coordinate string -> list of [lon, lat] (drop altitude)."""
    pts = []
    for chunk in raw.replace("\n", " ").split():
        parts = chunk.split(",")
        if len(parts) >= 2:
            pts.append([round(float(parts[0]), 6), round(float(parts[1]), 6)])
    return pts


def parse_description(desc, story=None):
    """Pull story / gloss / quote / page out of the CDATA HTML blob.

    Decodes ALL HTML entities (e.g. &#39;, &nbsp;) — not just a hand-picked few —
    so quotes display cleanly and the Gutenberg text-fragment links match. Also
    strips editorial prefixes that the KMZ sometimes glues to the front of the
    quote: a bracketed gloss "[…]", a parenthetical "(…)", and the story label.
    """
    if not desc:
        return {}
    # Normalise <br> to newlines; strip stray tags; decode entities; nbsp→space.
    txt = re.sub(r"<br\s*/?>", "\n", desc, flags=re.I)
    txt = re.sub(r"<[^>]+>", "", txt)
    txt = _html.unescape(txt).replace("\xa0", " ")
    lines = [ln.strip() for ln in txt.split("\n") if ln.strip()]
    out = {}
    if not lines:
        return out
    # Peel off (but don't emit) the leading story-label line "Story Title".
    if lines[0].startswith('"') and lines[0].endswith('"'):
        lines = lines[1:]
    if lines and lines[0].startswith("[") and lines[0].endswith("]"):
        out["gloss"] = lines[0][1:-1].strip()
        lines = lines[1:]
    quote = " ".join(lines).strip()
    m = re.search(r"\((\d+)\)\.?\s*$", quote)
    if m:
        out["page"] = int(m.group(1))
        quote = quote[: m.start()].strip()
    quote = quote.strip().strip('"').strip()

    # Peel off editorial prefixes glued to the front of the quote, iteratively.
    prev = None
    while prev != quote:
        prev = quote
        quote = re.sub(r"^\s*\[[^\]]*\]\s*", "", quote)        # [where the cars…]
        quote = re.sub(r"^\s*\([^)]*\)\s*", "", quote)         # (alternatively)
        if story:
            quote = re.sub(r'^\s*"?' + re.escape(story) + r'"?\s*', "", quote)
        quote = quote.lstrip('"').strip()

    out["quote"] = quote
    return out


def main(kml_path, out_path):
    root = ET.parse(kml_path).getroot()
    doc = root.find("k:Document", NS) or root
    features = []
    for folder in doc.findall("k:Folder", NS):
        story = text_of(folder, "name").strip().strip('"')
        for pm in folder.findall("k:Placemark", NS):
            name = text_of(pm, "name").strip()
            props = {"story": story, "name": name}
            props.update(parse_description(text_of(pm, "description"), story))

            point = pm.find("k:Point/k:coordinates", NS)
            line = pm.find("k:LineString/k:coordinates", NS)
            if point is not None and point.text:
                coords = parse_coords(point.text)
                if not coords:
                    continue
                geom = {"type": "Point", "coordinates": coords[0]}
                props["kind"] = "place"
            elif line is not None and line.text:
                coords = parse_coords(line.text)
                if len(coords) < 2:
                    continue
                geom = {"type": "LineString", "coordinates": coords}
                props["kind"] = "route"
            else:
                continue
            features.append({"type": "Feature", "properties": props, "geometry": geom})

    fc = {
        "type": "FeatureCollection",
        "metadata": {
            "title": "Mapping Dubliners Project",
            "source": "Jasmine Mulliken, PhD — https://mappingdubliners.org/",
            "license": "CC BY-NC 4.0",
            "derived_from": "https://mappingdubliners.org/files/mappingdublinersearth.kmz",
        },
        "features": features,
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(fc, f, ensure_ascii=False, indent=1)
    places = sum(1 for x in features if x["properties"]["kind"] == "place")
    routes = sum(1 for x in features if x["properties"]["kind"] == "route")
    print(f"Wrote {len(features)} features ({places} places, {routes} routes) -> {out_path}")


if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else "doc.kml"
    dst = sys.argv[2] if len(sys.argv) > 2 else "dubliners.geojson"
    main(src, dst)
