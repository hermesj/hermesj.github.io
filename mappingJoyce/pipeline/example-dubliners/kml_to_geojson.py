#!/usr/bin/env python3
"""Convert the Mapping Dubliners Project KMZ into a clean GeoJSON FeatureCollection.

Source data: "Mapping Dubliners Project" by Jasmine Mulliken, PhD,
licensed CC BY-NC 4.0 (https://works.hcommons.org/records/m5n9p-pr591).
Original KMZ: https://mappingdubliners.org/files/mappingdublinersearth.kmz

The KML groups placemarks into 15 folders, one per story of Joyce's
*Dubliners*. Each placemark carries a CDATA <description> of the form:

    "Story Title"<br>[a short gloss]<br><br>"a verbatim Joyce quote" (42).<br>

We split that into structured properties (story, gloss, quote, page) while
also keeping a cleaned-up `description` for fallback display. Geometry is
either a Point (a place) or a LineString (a character's route).

Usage:
    python3 kml_to_geojson.py path/to/doc.kml ../data/dubliners.geojson
"""
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


def parse_description(desc):
    """Pull story / gloss / quote / page out of the CDATA HTML blob."""
    if not desc:
        return {}
    # Normalise <br> to newlines, collapse whitespace.
    txt = re.sub(r"<br\s*/?>", "\n", desc, flags=re.I)
    txt = re.sub(r"<[^>]+>", "", txt)  # strip any other stray tags
    txt = txt.replace("&quot;", '"').replace("&apos;", "'").replace("&amp;", "&")
    lines = [ln.strip() for ln in txt.split("\n") if ln.strip()]
    out = {"description": "\n".join(lines)}
    if not lines:
        return out
    # First line is usually the story title in quotes.
    if lines[0].startswith('"') and lines[0].endswith('"'):
        out["story_label"] = lines[0].strip('"')
        lines = lines[1:]
    # A bracketed gloss often follows.
    if lines and lines[0].startswith("[") and lines[0].endswith("]"):
        out["gloss"] = lines[0][1:-1].strip()
        lines = lines[1:]
    # Remaining text is the quote; trailing "(NN)." is the page number.
    quote = " ".join(lines).strip()
    m = re.search(r"\((\d+)\)\.?\s*$", quote)
    if m:
        out["page"] = int(m.group(1))
        quote = quote[: m.start()].strip()
    out["quote"] = quote.strip().strip('"').strip()
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
            props.update(parse_description(text_of(pm, "description")))

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
