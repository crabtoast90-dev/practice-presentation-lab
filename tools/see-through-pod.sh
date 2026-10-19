#!/usr/bin/env bash
# Runs ON the RunPod pod (passed in as SCRIPT_B64 by tools/see-through.sh). Splits the hero
# into layers with See-through and serves /out on port 8888 (status.txt, log.txt, result.tgz).
# Never exits on its own (an exiting start command could restart the container).
# Safety: the pod removes itself 30 min after finishing, or 80 min after starting, whichever first.
mkdir -p /out && cd /out && (python -m http.server 8888 >/dev/null 2>&1 &)
echo "STARTING $(date -u +%T)" > /out/status.txt
selfkill() { sleep "$1"; echo "SELF-REMOVE $(date -u +%T)" >> /out/status.txt; runpodctl remove pod "$RUNPOD_POD_ID" || runpodctl stop pod "$RUNPOD_POD_ID"; }
(selfkill 4800 &)
exec > /out/log.txt 2>&1
set -x
nvidia-smi
cd /workspace 2>/dev/null || cd /
git clone --depth 1 https://github.com/mitmul/see-through && cd see-through
echo "INSTALLING $(date -u +%T)" > /out/status.txt
python -c "import torch;print(torch.__version__, torch.cuda.is_available())"
pip install -q -r requirements.txt || { echo "FAILED install" > /out/status.txt; selfkill 1800; }
ln -sf common/assets assets
curl -sSL -o /tmp/hero.png "$HERO_URL"
echo "RUNNING $(date -u +%T)" > /out/status.txt
python inference/scripts/inference_psd.py --srcp /tmp/hero.png --save_to_psd || { echo "FAILED inference" > /out/status.txt; selfkill 1800; }
cp -r workspace/layerdiff_output /out/ && cd /out && tar czf result.tgz layerdiff_output
ls -laR /out/layerdiff_output | head -100
echo "DONE $(date -u +%T)" > /out/status.txt
selfkill 1800
