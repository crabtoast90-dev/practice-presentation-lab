#!/usr/bin/env bash
# Start one RunPod GPU pod that runs tools/see-through-pod.sh on a hero image (paid, ~$0.34/h on an RTX 4090).
#   tools/see-through.sh <public-hero-image-url> [gpu type]   -> prints the new pod (id, GPU, $/h)
# Then poll https://<pod>-8888.proxy.runpod.net/status.txt, fetch result.tgz, and terminate with
#   tools/see-through.sh --terminate <pod>
# Uses RunPod's GraphQL API (the cloud proxy injects the key for api.runpod.io).
set -euo pipefail
gql() { curl -sS -X POST https://api.runpod.io/graphql -H 'Content-Type: application/json' -d "$(python3 -c 'import json,sys;print(json.dumps({"query":sys.argv[1]}))' "$1")"; }
if [ "$1" = "--terminate" ]; then
  gql "mutation { podTerminate(input: {podId: \"$2\"}) }"; echo
  gql 'query { myself { pods { id desiredStatus } } }'; echo
  exit
fi
B64=$(base64 -w0 "$(dirname "$0")/see-through-pod.sh")
GPU="${2:-NVIDIA GeForce RTX 4090}"
gql "mutation { podFindAndDeployOnDemand(input: { name: \"see-through-lab\", cloudType: ${CLOUD:-ALL}, gpuCount: 1, gpuTypeId: \"$GPU\",
  imageName: \"runpod/pytorch:2.8.0-py3.11-cuda12.8.1-cudnn-devel-ubuntu22.04\", containerDiskInGb: ${DISK:-50}, volumeInGb: 0, ports: \"8888/http\",
  env: [{key: \"SCRIPT_B64\", value: \"$B64\"}, {key: \"HERO_URL\", value: \"$1\"}],
  dockerArgs: \"bash -c 'echo \$SCRIPT_B64 | base64 -d > /run-job.sh && bash /run-job.sh'\" }) { id desiredStatus costPerHr machine { gpuDisplayName } } }"
