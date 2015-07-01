#!/usr/bin/env python

import os, sys, time, logging, signal
import RPi.GPIO as GPIO
from foosball_utils import DigitalFoosballSimulator as DFSim

# DigitalFoosball server info
SERVER_IP='127.0.0.1' # TODO
SERVER_PORT=80

# GPIO info - use BCM 23 and 24 (RPi2 board pins 16 and 18) for input
PIN_NUMBERING=GPIO.BCM
HOME_PIN=23
VISITOR_PIN=24
PIN_BOUNCETIME=300 #TODO - increase to 2000 (or so) to avoid double trigger?

class GoalReader(object):
    def __init__(self, server_ip='127.0.0.1', server_port=80):
        self.log = logging.getLogger('GoalReader')
        self.log.setLevel(logging.DEBUG)
        fh = logging.FileHandler('/var/log/goalreader.log')
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        fh.setFormatter(formatter)
        self.log.addHandler(fh)
        self.log.info('Creating DigitalFoosballSimulator w/ ip=%s  port=%s'%(server_ip,server_port))
        self.sim=DFSim(ip=server_ip, port=server_port)
        self.setupGPIO()

    def homeTeamScored(self, channel):
        self.log.info('Sending goal for Home Team')
        self.sim.sendHomeGoal()

    def visitorTeamScored(self, channel):
        self.log.info('Sending goal for Visitor Team')
        self.sim.sendVisitorGoal()

    def setupGPIO(self):
        self.log.info('Configuring GPIO for goal sensors - Home=%s  Visitor=%s  bouncetime=%s'%(HOME_PIN,VISITOR_PIN,PIN_BOUNCETIME))
        GPIO.setmode(PIN_NUMBERING)
        GPIO.setup(HOME_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        GPIO.setup(VISITOR_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        GPIO.add_event_detect(HOME_PIN, GPIO.RISING, callback=self.homeTeamScored, bouncetime=PIN_BOUNCETIME)
        GPIO.add_event_detect(VISITOR_PIN, GPIO.RISING, callback=self.visitorTeamScored, bouncetime=PIN_BOUNCETIME)

    def cleanup(self):
        self.log.info('Cleaning up GPIO configuration')
        GPIO.cleanup()


if __name__=='__main__':
    def handleSignal(signal, frame): pass
    signal.signal(signal.SIGINT, handleSignal)
    signal.signal(signal.SIGTERM, handleSignal)

    reader=GoalReader(SERVER_IP, SERVER_PORT)
    signal.pause() # wait for signal
    reader.cleanup()

