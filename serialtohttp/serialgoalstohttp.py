#!/usr/bin/env python
import serial
import os, sys, time
import logging
import threading
import foosball_utils

class SerialGoalReader(object):
    def __init__ (self, port="/dev/ttyACM0", server_ip="192.168.1.9", server_port=80):
        self.portname = port
        self.log = logging.getLogger("SerialGoalReader")
        self.log.setLevel(logging.DEBUG)
        ch = logging.FileHandler("/var/log/serialgoalreader.log")
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        ch.setFormatter(formatter)
        self.log.addHandler(ch)
        self.stopThread = False
        self.serial = None
        self.serialThread = None
       
        self.ip = server_ip
        self.port = server_port

        self.sim = foosball_utils.DigitalFoosballSimulator(ip=self.ip, port=self.port)

 
    def _initialize(self):
        self.log.info("Initializing serial reader with port %s" % self.portname)
        self.serial = serial.Serial(
            port=self.portname, 
            baudrate=9600, 
            timeout=1.0)


    def checkSerialPort(self):
        self.log.info("Going into checkSerialPort")
        self._initialize()
        activeRequest = []
        while not self.stopThread:
            try:
                line = self.serial.readline()
                if "Sending request..." in line:
                    self.log.info("Found new goal")
                    for x in range(7):
                        activeRequest.append(self.serial.readline())
                elif "Request done, checking response..." in line:
                    #Send the request
                    if "goals/home" in activeRequest[0]:
                        self.log.info("Sending goal for Home Team")
                        self.sim.sendHomeGoal()
                    elif "goals/visitors" in activeRequest[0]:
                        self.log.info("Sending goal for Visitor Team")
                        self.sim.sendVisitorGoal()
                    self.log.info(activeRequest)
                    activeRequest = []
            except Exception, e:
                self.log.error("There was an exception, but I am still continuing")
                self.log.error(e)
        self.log.info("Stopping checkSerialPort")
        self.serial.close()

    def stop(self):
        self.log.info("Stopping serial thread")
        if not self.serialThread:
            self.log.warn("There is no thread; returning")
            self.stopThread = False
            return
        self.stopThread = True
        self.serialThread.join()
        self.serialThread = None
        self.stopThread = False

    def start(self):
        self.log.info("Starting serial thread")
        if self.serialThread != None:
            self.log.warn("Thread was already running, stopping")
            self.stop()
 
        self.serialThread = threading.Thread(target=self.checkSerialPort)
        self.serialThread.start()

if __name__ == "__main__":

    reader = SerialGoalReader()

    reader.start()

    time.sleep(15)

    reader.stop()

