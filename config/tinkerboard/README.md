# Setup on Asus TinkerBoard

The [Asus TinkerBoard](https://www.asus.com/us/Single-Board-Computer/Tinker-Board/)
is a more powerful SBC than the Raspberry Pi, but setup is similar.
In particular, the TinkerBoard supports 4K output, which makes it better for modern TVs.

Basic familiarity with Linux will be helpful, but I've tried to give the exact commands needed here to make it easy
to figure out what you need to do.

## 1. Set Up the OS

This package runs on the Debian Linux distro provided by Asus.

### 1.1. Install Linux

Download from the [Asus Support page](https://www.asus.com/uk/supportonly/TInker%20Board2GB/HelpDesk_Download/)
and burn the image to a microSDHC card.
Insert the card into the slot on the bottom of the TinkerBoard.

Plug the HDMI port into your TV and attach a keyboard and mouse to the USB ports.

Boot it up by connecting the power to the micro USB port.

### 1.2. Networking

If using WiFi, configure the network.
From the lower-left corner menu open the _Preferences_ | _Network Connections_ application and add a network.

To find your IP address, execute in a terminal:
```
ip address
```
Note the IP address in a line like this: "inet **192.168.1.123** /24 brd 10.0.1.255 scope global dynamic wlan0"

### 1.3. Date/Time

Use the _Preferences_ | _Time and Date_ application to change the time zone to your local one and correct the time if
necessary.

Or, [from these instructions](https://superuser.com/a/1063029):
```
timedatectl list-timezones
sudo timedatectl set-timezone America/Los_Angeles
```

### 1.4. Host Name

Use the _Preferences_ | _Network_ application to change the hostname.

In order to access the tinkerboard from other computers by name,
[from these instructions](https://wiki.debian.org/ZeroConf) set up zero-configuration networking:
```
sudo apt-get install avahi-daemon avahi-discover libnss-mdns
```

## 2. Install the Server

The pictures are managed by a small Node.js server running on the TinkerBoard.

### 2.1. Install Node.js

[From these instructions](https://nodejs.org/en/download/package-manager/), in a terminal:
```
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2.2. Copy and Build the Application

Execute in a terminal:
```
git clone 'https://github.com/JohnCoker/pictureframe.git'
cd pictureframe
npm install
```

### 2.3. Copy your Pictures

(Optional) copy your existing images for the frame into the `pictureframe/pictures` directory on the TinkerBoard.

### 2.4. Start the Server at Boot

[From these instructions](https://github.com/chovy/node-startup), in a terminal:
```
sudo cp config/tinkerboard/init.d /etc/init.d/pictureframe
sudo chmod 755 /etc/init.d/pictureframe
sudo update-rc.d pictureframe defaults
sudo /etc/init.d/pictureframe start
```

## 3. Set Up The Frame Display

The current picture is displayed on the main HDMI port of the TinkerBoard, which is connected to your TV.

### 3.1. Hide Mouse Cursor

[From these instructions](https://jackbarber.co.uk/blog/2017-02-16-hide-raspberry-pi-mouse-cursor-in-raspbian-kiosk),
in a terminal:
```
sudo apt-get install unclutter
```

### 3.2. Start Chromium Kiosk

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

## 4. Reboot

Execute in a terminal:
```
sudo reboot
```

The TinkerBoard should reboot showing one of the pictures and can be managed through the web.

Connect to the manage interface from your computer by name or the IP address noted earlier.
