#!/bin/bash
SCRIPT_NAME=/data/workspace/digitalfoosball/serialtohttp/serialgoalstohttp.py
export PYTHON_PATH=${PYTHON_PATH}:/data/workspace/digitalfoosball/serialtohttp/

case "$1" in
    start)
    echo "Starting serialtohttp goals script..."
    sudo python $SCRIPT_NAME &
    echo "$!" > /var/run/node_serialhttp.pid
    ;;
    stop)
    echo "Stoping nodejs for mobile app..."
    kill `cat /var/run/node_mobile_serialhttp.pid`
    ;;
    *)
    echo "Usage $0 {start|stop}"
    ;;
esac
