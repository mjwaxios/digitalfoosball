#!/bin/sh

NODE_BIN=`which nodejs`
SCRIPT_NAME=`which $0`
SCRIPT_PATH=/data/workspace/digitalfoosball/league/lib
CALC_BIN=$SCRIPT_PATH/calc.js

case "$1" in

    start)
	echo "Starting nodejs for league calculation..."
	$NODE_BIN $CALC_BIN  >> /var/log/node_calc.log 2>&1 &
	echo "$!" > /var/run/node_calc.pid
	;;
    stop)
	echo "Stoping nodejs for league calculation..."
	kill `cat /var/run/node_calc.pid`
	;;
    *)
	echo "Usage $0 {start|stop}"
	;;
esac
