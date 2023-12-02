#!/bin/sh 
xset s off
xset s noblank
unclutter -idle 1 &
exec chromium --noerrdialogs --kiosk http://localhost/frame.html > /dev/null 2>&1
