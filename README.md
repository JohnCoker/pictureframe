# Picture Frame

This repository contains the code that supports using a
[single-board computer](https://en.wikipedia.org/wiki/Single-board_computer),
to drive a TV for use as a picture frame.
In particular, it shows a different picture each day from the collection of photos you upload.

## Architecture

The picture frame is implemented with a single [Node.js](https://en.wikipedia.org/wiki/Node.js)
application that supports two different web pages:
 - `/`: view and control the picture frame's behavior
 - `/frame`: page to view the current day's picture

Connections can be made to the manage page to view pictures uploaded and control the behavior.

New pictures can be uploading from that page, or you can issue HTTP requests PUT and DELETE in the
`/pictures/` folder.

A web browser in kiosk mode is pointed to the `/frame` page that displays only the current picture.
The web browser needs to support
[server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events),
which is used to update the display when the current picture changes (either because it is a new
day or because the user updated the picture from the manage page).

## Setting Up

You need to use an SBC capable of running Node.js with an HDMI output. For recent TVs, you want
one capable of 4k (2160p) output, any frame rate. For older TVs, HD is fine (1080p).
As far as disk space, you need enough for the OS and the pictures you want to upload.
(This application requires only a few hundred Mb.)

1. Set up your SBC running whatever flavor of Linux is supported and set up networking.
   If there is another web server running already, disable it.

2. Install Node.js then install this application and set it to start at computer boot-up.

3. Set the screen saver to execute the browser in kiosk mode showing `http://localhost/frame`.

4. Copy your pictures into the pictures folder of this app or upload them through the web server.

5. Connect the SBC's HDMI output to your TV.

6. Connect to the SBC's web interface from your computer or phone to manage it.
