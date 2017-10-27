# Setup on Raspberry Pi 3

The [Raspberry Pi](https://www.raspberrypi.org/) is a popular line of single-board computers that can run a variety of
operating systems.
Basic familiarity with Linux will be helpful, but I've tried to give the exact commands needed here to make it easy
to figure out what you need to do.

## 1. Set Up the OS

This package runs on the Debian Linux distro named "Raspbian" provided by Raspberry Pi.

### 1.1. Install Linux

Download from the [Raspoberry Pi Downloads page](https://www.raspberrypi.org/downloads/raspbian/)
the "Raspbian Stretch with Desktop" and burn the image to a microSDHC card.
Insert the card into the slot on the bottom of the Pi.

Plug the HDMI port into your TV and attach a keyboard and mouse to the USB ports.

Boot it up by connecting the power to the micro USB port.

### 1.2. Networking

If using WiFi, configure the network.
At the top-right corner of the screen is the network icon. Click it, select your wireless network and enter the
WiFi password.

To find your IP address, execute in a terminal:
```
ip address
```
Note the IP address in a line like this: "inet **192.168.1.123** /24 brd 10.0.1.255 scope global dynamic wlan0"

If you want to be able to access the machine remotely, enable SSH.
From the upper-left corner menu open the _Preferences_ | _Raspberry Pi Configuration_ application and enable
"SSH" on the *Interfaces* tab. (The default user is "pi" and the default password is "raspberry".)

If you do enable SSH, change your password to avoid the annoying dialogs at start up. You can change your password
in the terminal:
```
passwd
```

### 1.3. Date/Time

Open a terminal window and set the time zone interactively:
```
sudo dpkg-reconfigure tzdata
```

### 1.4. Host Name

From the upper-left corner menu open the _Preferences_ | _Raspberry Pi Configuration_ application and change the
hostname on the *System* tab.

### 1.5 Display Resolution

While there on the *System* tab, make sure the resolution is correct for your TV.
This will generally be "1920x1080 60Hz" (1080p).

## 2. Install the Server

The pictures are managed by a small Node.js server running on the Pi.

### 2.1. Upgrade Node.js

The server needs at least version 6 of node (with ES6 support). Check which version of node you're running
with `node --version`. If this prints out anything less than v6.11.0, upgrade to something less ancient.
Execute in a terminal:
```
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt install nodejs
```

### 2.2. Copy and Build the Application

Execute in a terminal:
```
git clone 'https://github.com/JohnCoker/pictureframe.git'
cd pictureframe
npm install
```

### 2.3. Copy your Pictures

(Optional) copy your existing images for the frame into the `pictureframe/pictures` directory on the Pi.

### 2.4. Start the Server at Boot

[From these instructions](https://github.com/chovy/node-startup), in a terminal:
```
sudo cp config/raspberrypi/init.d /etc/init.d/pictureframe
sudo chmod 755 /etc/init.d/pictureframe
sudo update-rc.d pictureframe defaults
sudo /etc/init.d/pictureframe start
```

## 3. Set Up The Frame Display

The current picture is displayed on the main HDMI port of the Pi, which is connected to your TV.

### 3.1. Hide Mouse Cursor

[From these instructions](https://jackbarber.co.uk/blog/2017-02-16-hide-raspberry-pi-mouse-cursor-in-raspbian-kiosk),
in a terminal:
```
sudo apt-get install unclutter
```

### 3.2. Start Chromium Kiosk

[From these instructions](https://www.danpurdy.co.uk/web-development/raspberry-pi-kiosk-screen-tutorial/),
edit `~/.config/lxsession/LXDE-pi/autostart` to look like this:
```
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi
# @xscreensaver -no-splash
# @point-rpi

@xset s off
@xset -dpms
@xset s noblank
@sed -i 's/"exited_cleanly": false/"exited_cleanly": true/' ~/.config/chromium/Default/Preferences
@unclutter -idle 0
@/usr/lib/chromium-browser/chromium-browser --noerrdialogs --kiosk http://localhost/frame.html
```
(Remove or comment out the "@xscreensaver" and "@point-rpi" lines and add the lines starting with "@xset".)

## 4. Reboot

Execute in a terminal:
```
sudo reboot
```

The Pi should reboot showing one of the pictures and can be managed through the web.

Connect to the manage interface from your computer by name or the IP address noted earlier.
