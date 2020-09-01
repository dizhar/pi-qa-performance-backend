#!/bin/bash
set -e

CONFIG_PATH=${1:-"config/config.json"}
SITE="$2"
IMAGE_TAG=${3:-"master"}

[[ "$CONFIG_PATH" == "" ]] && echo "CONFIG_PATH (1st parameter) cannot be empty" && exit 1
[[ "$SITE" == "" 	]] && echo "SITE (2nd parameter) cannot be empty" && exit 1

IMAGE="pageintegrity.azurecr.io/pi-core/pi-qa-sitespeed:${IMAGE_TAG}"

echo ""
echo "Pulling image $IMAGE"
docker pull $IMAGE

echo ""
echo "Running sitespeed.io"
docker run --rm -v sitespeed-config:/root/config -v sitespeed-script:/root/script -v sitespeed-result:/sitespeed-result $IMAGE --config root/$CONFIG_PATH $SITE

    