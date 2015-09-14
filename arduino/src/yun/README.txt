This code will create a script on the Yun for home and visitors.  These scripts are called each time a goal is scored for that side.
A Sensor should be hooked up to pin 2 and the other goal hooked up to pin 3.
The Adafruit IR beam break sensors work well for this.  They take Gnd, +5 on the Emmiter, and Gnd, +5, Ouput for the receivers.  
The output is connected to pin 2 for one goal, pin 3 for the other and the Arduino is configured for INPUT_PULLUP on both those
pins.  Then an Interrupt Service Routine is connected to each pin.  The Arduino UNO only contains two dedicated pins for interrupts 
so these two pins must be used.

Theory of Operation:

The ISR for a given goal will run when the sensor is beam is broken. It will
increment a count and set the lastISR time to the current time in
milliseconds.  This is checked on the next interrupt to make sure one second
has passed to debounce the goal.  The same timer is used for both goals so
only one goal from either side per second is recorded.  The main arduino loop
will check to see if a goal has been scored sense the last loop. If so, it
calls the Yun script when makes a curl call to post the goal to the Scoring
system.  A notice on the console is printed and a buzzer is turned on to
indicate a goal.

Sept, 2015 MJ Wyrick

