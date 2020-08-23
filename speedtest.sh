set -e

COMMAND=$1
FILEPATH="$2"
SITE="$3"

[[ "$COMMAND" == "" ]] && echo "COMMAND (1st parameter) cannot be empty" && exit 1

CONFIG_PATH=${3:-""}

IMAGE="pageintegrity.azurecr.io/pi-core/pi-qa-sitespeed"
VOLUME="~/data/piqaautomationstorage/performance"

docker pull $IMAGE


function run(){
	  		docker run --rm  \
			-v `pwd`/data/piqaautomationstorage/sitespeed-result:/sitespeed-result \
			$IMAGE \
			--config "$FILEPATH" "$SITE"
}


function local(){
   	echo $FILEPATH
	echo ${FILEPATH%/*}
    echo `pwd`/$(basename "${FILEPATH%/*}")
    echo `pwd`/$(basename $(dirname "${FILEPATH%/*}"))
	echo `pwd`/$FILEPATH
	echo `pwd`

	while
	port=$(shuf -n 1 -i 49152-65535)
	netstat -atun | grep -q "$port"
	do
	continue
	done


		docker run --rm  \
			-v `pwd`/data/piqaautomationstorage/sitespeed-result:/sitespeed-result \
			-v `pwd`:/root  -p "$port":"$port" $IMAGE --config root/"$FILEPATH" "$SITE"
}


case $COMMAND in 
	"run" 	) 
	    [[ "$FILEPATH" == "" ]] && echo "SITE (2rd parameter) cannot be empty" && exit 1
		[[ "$SITE" == "" 	]] && echo "SITE (3rd parameter) cannot be empty" && exit 1
		run
		;;

	"local" 	) 
	    [[ "$FILEPATH" == "" ]] && echo "SITE (2rd parameter) cannot be empty" && exit 1
		[[ "$SITE" == "" 	]] && echo "SITE (3rd parameter) cannot be empty" && exit 1
		local
		;;

	* 	) 
		echo "Command '$COMMAND' is invalid"
esac
