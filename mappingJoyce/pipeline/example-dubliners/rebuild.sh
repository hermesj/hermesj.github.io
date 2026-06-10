#!/usr/bin/env bash
# Rebuild the Dubliners layer from Mulliken's KML — the full, fool-proof chain.
# kml_to_geojson.py WIPES srcText and essay, so the two enrichment steps below
# are mandatory; running this script instead of the steps by hand makes it
# impossible to forget them. Needs network (add_srctext downloads Gutenberg #2814).
set -euo pipefail
cd "$(dirname "$0")"

python3 kml_to_geojson.py source-doc.kml ../../data/dubliners.geojson
python3 add_srctext.py ../../data/dubliners.geojson
python3 add_essays.py ../../data/dubliners.geojson

# lint the result (orphaned annotations, missing essays/srcText, …)
python3 ../check.py --root ../..
