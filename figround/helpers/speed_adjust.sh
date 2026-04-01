#!/bin/bash
# ============================================================
# speed_adjust.sh — Batch speed adjustment for figround audio
#
# Slows down Odysseus tracks and speeds up Siren tracks
# using ffmpeg asetrate + aresample.
# Auto-detects source sample rate per file via ffprobe.
#
# Usage: ./speed_adjust.sh
#        (run from the audio/ directory)
# ============================================================

# ── CONFIGURATION ──────────────────────────────────────────

# Folders to process (relative to this script's location)
ODYSSEUS_DIRS=("Odysseus_de" "Odysseus_en")
SIREN_DIRS=("Siren_de" "Siren_en")

# Speed factors
#   < 1.0 = slower (e.g. 0.85 = 85% speed)
#   > 1.0 = faster (e.g. 1.1  = 110% speed)
ODYSSEUS_SPEED=0.85
SIREN_SPEED=1.05

# File extensions to process
EXTENSIONS=("m4a" "mp3" "wav")

# Output prefix
SLOW_PREFIX="slow_"
FAST_PREFIX="fast_"

# Overwrite existing output files? (true/false)
OVERWRITE=true

# ── END CONFIGURATION ─────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

get_sample_rate() {
    ffprobe -v error -select_streams a:0 \
        -show_entries stream=sample_rate \
        -of default=noprint_wrappers=1:nokey=1 "$1"
}

process_folder() {
    local dir="$1"
    local speed="$2"
    local prefix="$3"
    local full_path="${SCRIPT_DIR}/${dir}"

    if [ ! -d "$full_path" ]; then
        echo "⚠  Skipping ${dir} (not found)"
        return
    fi

    local count=0

    for ext in "${EXTENSIONS[@]}"; do
        for file in "${full_path}"/*.${ext}; do
            [ -f "$file" ] || continue

            local basename="$(basename "$file")"

            # Skip files that already have the prefix
            if [[ "$basename" == "${SLOW_PREFIX}"* ]] || [[ "$basename" == "${FAST_PREFIX}"* ]]; then
                echo "   ⏭  Skipping ${basename} (already processed)"
                continue
            fi

            local outfile="${full_path}/${prefix}${basename}"

            if [ -f "$outfile" ] && [ "$OVERWRITE" != true ]; then
                echo "   ⏭  ${prefix}${basename} exists, skipping (OVERWRITE=false)"
                continue
            fi

            # Detect source sample rate
            local src_rate
            src_rate=$(get_sample_rate "$file")
            if [ -z "$src_rate" ] || [ "$src_rate" = "N/A" ]; then
                echo "   ✗  Could not detect sample rate for ${basename}, skipping"
                continue
            fi

            echo "   ⚙  ${basename} (${src_rate} Hz) → ${prefix}${basename}  (×${speed})"
            ffmpeg -y -i "$file" \
                -filter:a "asetrate=${src_rate}*${speed},aresample=${src_rate}" \
                "$outfile" 2>/dev/null

            if [ $? -eq 0 ]; then
                count=$((count + 1))
            else
                echo "   ✗  Error processing ${basename}"
            fi
        done
    done

    echo "   ✓  ${count} file(s) processed in ${dir}"
}

echo ""
echo "═══════════════════════════════════════════"
echo "  figround audio speed adjustment"
echo "  Odysseus: ×${ODYSSEUS_SPEED} (${SLOW_PREFIX}…)"
echo "  Siren:    ×${SIREN_SPEED} (${FAST_PREFIX}…)"
echo "  Sample rate: auto-detected per file"
echo "═══════════════════════════════════════════"
echo ""

echo "── Odysseus (slowing down) ──"
for dir in "${ODYSSEUS_DIRS[@]}"; do
    echo "📂 ${dir}/"
    process_folder "$dir" "$ODYSSEUS_SPEED" "$SLOW_PREFIX"
done

echo ""
echo "── Siren (speeding up) ──"
for dir in "${SIREN_DIRS[@]}"; do
    echo "📂 ${dir}/"
    process_folder "$dir" "$SIREN_SPEED" "$FAST_PREFIX"
done

echo ""
echo "Done."
