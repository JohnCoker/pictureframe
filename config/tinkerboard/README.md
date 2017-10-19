# Setup on Asus TinkerBoard

The [Asus TinkerBoard](https://www.asus.com/us/Single-Board-Computer/Tinker-Board/)
is a more powerful SBC than the Raspberry Pi, but setup is similar.
Basic familiarity with Linux will be helpful, but I've tried to give the exact commands needed here to make it easy
to figure out what you need to do.

## 1. Install the OS

Download from the [Asus Support page](https://www.asus.com/uk/supportonly/TInker%20Board2GB/HelpDesk_Download/)
and burn the image to a microSDHC disk.

## 2. Set up the Network

On the TinkerBoard, execute in a terminal:
```
ip address
```
Note the IP address in a line like this: "inet **192.168.1.123** /24 brd 10.0.1.255 scope global dynamic wlan0"

## 3. Install Node.js

[From these instructions](https://nodejs.org/en/download/package-manager/), in a terminal:
```
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 4. Copy over this GitHub repo directory to the machine and set up the application:

Execute in a terminal:
```
git clone 'http:https://github.com/JohnCoker/pictureframe.git'
cd pictureframe
npm install
```

## 5. Copy your Pictures

(Optional) copy your existing images for the frame into the `pictureframe/pictures` directory on the TinkerBoard.

## 6. Start the App at Boot

[From these instructions](https://github.com/chovy/node-startup), in a terminal:
```
sudo cp config/tinkerboard/init.d /etc/init.d/pictureframe
sudo chmod 755 /etc/init.d/pictureframe
sudo update-rc.d pictureframe defaults
sudo /etc/init.d/pictureframe start
```
Connect to the manage interface from your computer: "http://192.168.1.123/" (IP address noted earlier)

## 7. Hide Mouse Cursor

[From these instructions](https://jackbarber.co.uk/blog/2017-02-16-hide-raspberry-pi-mouse-cursor-in-raspbian-kiosk),
in a terminal:
```
sudo apt-get install unclutter
```

## 8. Start Chromium Kiosk

[From these instructions](https://www.danpurdy.co.uk/web-development/raspberry-pi-kiosk-screen-tutorial/),
edit `~/.config/lxsession/LXDE/autostart` to look like this:
```
@lxpanel --profile LXDE
@pcmanfm --desktop --profile LXDE
# @xscreensaver -no-splash

@xset s off
@xset -dpms
@xset s noblank
@sed -i 's/"exited_cleanly": false/"exited_cleanly": true/' ~/.config/chromium/Default/Preferences
@unclutter -idle 0
@chromium --noerrdialogs --kiosk http://localhost/frame.html
```
(Remove or comment out the "@xscreensaver" line and add the lines starting with "@xset".)

## 9. Reboot

Execute in a terminal:
```
sudo reboot
```

The SBC should reboot showing one of the pictures.
