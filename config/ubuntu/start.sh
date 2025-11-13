#!/bin/sh 
xset s off
xset s noblank
unclutter -idle 1 &
exec chromium --noerrdialogs --kiosk --simulate-outdated-no-au='Tue, 31 Dec 2099 23:59:59 GMT' 'http://localhost/frame.html' > /dev/null 2>&1
