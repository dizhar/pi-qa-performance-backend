#!/bin/bash
set -e

# hard coding 'run' 
COMMAND="run"

CONFIG_PATH=${1:-"config/config.json"}
SITE="$2"

IMAGE="pageintegrity.azurecr.io/pi-core/pi-qa-sitespeed"

docker pull $IMAGE

function run(){
	# while
    #    port=$(shuf -n 1 -i 49152-65535)
    #    netstat -atun | grep -q "$port"
	#do
	#    continue
	#done

	# docker run --rm  \
	#	-v `pwd`/data/piqaautomationstorage/sitespeed-result:/sitespeed-result \
	#	-v `pwd`:/root  -p "$port":"$port" $IMAGE --config root/"$CONFIG_PATH" "$SITE"

	docker run --rm -v sitespeed-config:/root/config -v sitespeed-script:/root/script -v sitespeed-result:/sitespeed-result $IMAGE --config root/$CONFIG_PATH $SITE	
}

case $COMMAND in 
	"run" 	) 
	    [[ "$CONFIG_PATH" == "" ]] && echo "CONFIG_PATH (1rd parameter) cannot be empty" && exit 1
		[[ "$SITE" == "" 	]] && echo "SITE (2nd parameter) cannot be empty" && exit 1
		run
		;;
	* 	) 
		echo "Command '$COMMAND' is invalid"
esac