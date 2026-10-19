#!/usr/bin/env bash
# One Kling 3.0 Pro "card is born" clip through fal (paid: about $0.56 for 5 s, audio off).
# The hero is both the start and end frame, so the clip loops back into the static card.
#   tools/kling.sh <hero-image-url> <out.mp4> "<prompt>"
# FAL_KEY is injected by the cloud proxy; elsewhere export it and add an Authorization header.
set -euo pipefail
IMG="$1"; OUT="$2"; PROMPT="$3"
EP="fal-ai/kling-video/v3/pro/image-to-video"
NEG="blur, distort, low quality, camera movement, zoom, cut, scene change, extra limbs, face morphing, off-model face, text, watermark"
AUTH=(); [ -n "${FAL_KEY:-}" ] && AUTH=(-H "Authorization: Key $FAL_KEY")
BODY=$(python3 -c 'import json,sys; print(json.dumps({"start_image_url":sys.argv[1],"end_image_url":sys.argv[1],"prompt":sys.argv[2],"negative_prompt":sys.argv[3],"duration":"5","generate_audio":False,"cfg_scale":0.5}))' "$IMG" "$PROMPT" "$NEG")
SUB=$(curl -sS "${AUTH[@]}" -H 'Content-Type: application/json' -X POST "https://queue.fal.run/$EP" -d "$BODY")
echo "submitted: $SUB"
STATUS_URL=$(echo "$SUB" | python3 -c 'import json,sys;print(json.load(sys.stdin)["status_url"])')
RESP_URL=$(echo "$SUB" | python3 -c 'import json,sys;print(json.load(sys.stdin)["response_url"])')
for i in $(seq 1 120); do
  S=$(curl -sS "${AUTH[@]}" "$STATUS_URL" | python3 -c 'import json,sys;print(json.load(sys.stdin).get("status"))')
  [ "$S" = "COMPLETED" ] && break
  sleep 10
done
R=$(curl -sS "${AUTH[@]}" "$RESP_URL"); echo "result: $R"
VID=$(echo "$R" | python3 -c 'import json,sys;print(json.load(sys.stdin)["video"]["url"])')
curl -sS -o "$OUT" "$VID"; echo "saved $OUT"
