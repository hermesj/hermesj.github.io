#!/usr/bin/env bash

INPUT_DIR="${1:-.}"

find "$INPUT_DIR" -type f \( -iname "*.mp3" -o -iname "*.wav" -o -iname "*.m4a" -o -iname "*.aiff" \) | while read -r file; do
  dir="$(dirname "$file")"
  base="$(basename "$file")"
  out_file="$dir/mono_$base"

  echo "Converting: $file → $out_file"

  ffmpeg -y -i "$file" -map a -ac 1 -b:a 96k "$out_file"
done

echo "Done."