#!/usr/bin/env bash
# Kling MP4 -> web copies: public/reveal/<name>.webm (VP9) and .mp4 (H.264, for older iPhones). 720 px wide, no audio.
#   tools/encode-reveal.sh <kling.mp4> <name>
set -euo pipefail
ffmpeg -v error -y -i "$1" -an -vf scale=720:-2 -c:v libvpx-vp9 -crf 33 -b:v 0 -row-mt 1 -deadline good -cpu-used 2 "public/reveal/$2.webm"
ffmpeg -v error -y -i "$1" -an -vf scale=720:-2 -c:v libx264 -crf 25 -preset slow -pix_fmt yuv420p -movflags +faststart "public/reveal/$2.mp4"
ls -la "public/reveal/$2".*
