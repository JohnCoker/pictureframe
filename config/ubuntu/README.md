# Setup on Ubuntu Linux

Pretty much any computer can run Ubuntu, but I'm using an Intel NUC as a compact yet powerful computer with a good
video card.

## Ubuntu OS

Install Ubuntu Desktop (minimal is fine).
Create a default user with the account name "pictureframe" and enable auto-login.
Install Node.js, npm and Chromium.

## Node.js Server

Clone the repo to your home directory and build it:
```
git clone 'https://github.com/JohnCoker/pictureframe.git'
cd pictureframe
npm install
```

Using systemd is the easiest way to run a daemon, with [pictureframe.service](pictureframe.service):
```
sudo cp config/ubuntu/pictureframe.service /etc/systemd/system/
sudo systemctl enable pictureframe.service
sudo systemctl start pictureframe.service
```

Now the server will run as the default web server (port 80).

By default, the `Pictures` directory in your home directory is used. If you want to change this, be sure to edit
the location in `server.js`.

## Start the Frame

Use the [start.sh](start.sh) script or similar to start the picture frame using the Chromium browser.
You can test that it works by running it. Note that it will take over the main display so you want to have a way to
ssh into the machine.

To have the frame start automatically at login, enable this script using the Startup Applications app.


