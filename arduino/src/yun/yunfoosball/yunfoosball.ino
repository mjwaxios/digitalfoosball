//****************************************************************
//  Foosball table interface to Adafruit IR break beam sensors
//
//  Connect Yellow data line to Pin 2 from first goal
//  Connect Yellow data line to Pin 3 from second goal
//  Power emmiter and receiver from +5v
//
//  This will use the Yun to call curl to post the goals
//
//                       8/2015 MJ Wyrick
//****************************************************************

// Include for F() macro for our Strings
#include <avr/pgmspace.h>

// Pins
#define IR0PIN 2
#define IR1PIN 3
#define BUZZERPIN 9

// Yun
#include <Process.h>
#include <FileIO.h>

#define HOMENAME "/tmp/home.sh"
#define VISITORSNAME "/tmp/visitors.sh"

#define BUZZERFREQ 880   // A5
#define BUZZERFREQ2 440  //A4
#define BUZZERTIME 400

//****************************************************************
// Globals
//****************************************************************
volatile int YGoals = 0;  // Hold Yellow Goals
volatile int BGoals = 0;  // Hold Visitors Goals
int lastYGoals = 0;
int lastBGoals = 0;
long lastISR = 0;  // Time of last ISR, Same for both goals

//****************************************************************
// Interrupt Service Routine for Interrupt Zero
//****************************************************************
void InterruptZero() {
  long ct = millis();
  if (ct > (lastISR + 1000)) {
    YGoals++;
    lastISR = ct;
  }
}

//****************************************************************
// Interrupt Service Routine for Interrupt One
//****************************************************************
void InterruptOne() {
  long ct = millis();
  if (ct > (lastISR + 1000)) {
    BGoals++;
    lastISR = ct;
  }
}

//****************************************************************
//  Create the home and visitors scripts to post goals
//  NOTE: Hardcoded IP address of the Scoring system
//****************************************************************
void uploadScript() {
  Console.println(F("Creating Scripts."));
  
  File script1 = FileSystem.open(HOMENAME, FILE_WRITE);
  script1.print(F("#!/bin/sh\n"));
  script1.print(F("curl 10.10.10.128/events/goals/home -H \'token=1,main\' -d \"\""));
  script1.close();  // close the file
  delay(500); 
  Process chmod;
  chmod.begin(F("chmod"));         // chmod: change mode
  chmod.addParameter("+x");        // x stays for executable
  chmod.addParameter(HOMENAME);  // path to the file to make it executable
  chmod.run();
  delay(500); 

  File script2 = FileSystem.open(VISITORSNAME, FILE_WRITE);
  script2.print(F("#!/bin/sh\n"));
  script2.print(F("curl 10.10.10.128/events/goals/visitors -H \'token=1,main\' -d \"\""));
  script2.close();  // close the file
  delay(500); 
  chmod.begin(F("chmod"));         // chmod: change mode
  chmod.addParameter("+x");        // x stays for executable
  chmod.addParameter(VISITORSNAME);  // path to the file to make it executable
  chmod.run();
  delay(500); 

  Console.println(F("Done Creating Scripts."));
}

/**************************************************************************/
/*
    Arduino setup function (automatically called at startup)
*/
/**************************************************************************/
void setup(void) 
{
  // Setup the Yun Bridge, Console, and FileIO
  Bridge.begin();
  Console.begin();
  FileSystem.begin();

  // Wait for Console to load
  //while(!Console);

  // Setup Light Sensor Interrupt
  // Set input pins to internal Pullup
  pinMode(IR0PIN, INPUT_PULLUP);
  attachInterrupt(0, InterruptZero, FALLING);
  pinMode(IR1PIN, INPUT_PULLUP);
  attachInterrupt(1, InterruptOne, FALLING);

  // Setup Buzzer
  pinMode(BUZZERPIN, OUTPUT);

  uploadScript();
}

/**************************************************************************/
/*
    Arduino loop function, called once 'setup' is complete (your own code
    should go here)
*/
/**************************************************************************/
void loop(void) 
{
  Process onGoal;

  // Check Goal State
  // Should be safe to use Goal without turning off interrupts
  if (YGoals > lastYGoals) {
    lastYGoals = YGoals;
    Console.print("YGoals: ");
    Console.println(lastYGoals);
    onGoal.begin(VISITORSNAME);
    onGoal.run();
    tone(BUZZERPIN, BUZZERFREQ, BUZZERTIME);
  } // Goal

  // Check Goal State
  // Should be safe to use Goal without turning off interrupts
  if (BGoals > lastBGoals) {
    lastBGoals = BGoals;
    Console.print("BGoals: ");
    Console.println(lastBGoals);
    onGoal.begin(HOMENAME);
    onGoal.run();
    tone(BUZZERPIN, BUZZERFREQ2, BUZZERTIME);
  } // Goal

  delay(100);  // Just so we don't spin
} // loop


