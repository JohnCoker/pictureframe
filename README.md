# Picture Frame

This repository contains the code that supports using a
[single-board computer](https://en.wikipedia.org/wiki/Single-board_computer)
to drive a TV for use as a picture frame.
In particular, it shows a different picture each day from the collection of photos you upload.

## Architecture

The picture frame is implemented with a single [Node.js](https://en.wikipedia.org/wiki/Node.js)
server that supports two different web pages:
 - `/manage.html`: view and control the picture frame's behavior
 - `/frame.html`: page to view the current day's picture

Connections can be made to the manage page to manage pictures and control the behavior.
New pictures can be uploading from that page, or you can issue HTTP requests PUT and DELETE in the
`/pictures/` folder.

A web browser in kiosk mode is pointed to the `/frame.html` page that displays only the current picture.
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

3. Set the computer to start a browser in kiosk mode showing `http://localhost/frame`.

4. Copy your pictures into the pictures folder of this app or upload them through the web server.

5. Connect the SBC's HDMI output to your TV.

6. Connect to the SBC's web interface from your computer or phone to manage it.

See detailed instructions for individual SBCs in the `config` directory.

## Why?

There are many "screen saver" programs that can play a sequence of images; why build this?

My wife and I like to travel and the the most valuable benefit of travel is the memories. I wanted something that would
show one picture each day without any manual intervention. We connect this to HDMI1 input of the TV so that when
you turn it on, the picture of the day is showing. I look forward each morning to finding out what the picture of the
day is and being reminded of something special we saw.

To make this work, I wanted:
 - a different picture to display each day
 - the _same_ picture to show for the whole day
 - the same picture to be chosen at different locations
 - pictures not to repeat until all were shown

To do this, each day is assigned a number (the number of days since the beginning of 2000). This allows the pictures
to be traversed in a [linear congruential sequence](https://en.wikipedia.org/wiki/Linear_congruential_generator)
using the day number as the index.

So as long as the clock on the SBC is set to the local time, a consistent picture of the day will be chosen regardless
of when it starts up. This means that as long as all have the same set of pictures, multiple picture frames will choose
the same picture of the day.

## Organization

The top-level `index.js` script contains the logic that manages the HTTP routes using Express.
The `lib` directory contains modules which implement classes used by the server.

| README.md    | this file |
| artwork      | original artwork |
| bin          | scripts |
| config       | server config and setup instructions |
| index.js     | Node.js module file |
| lib          | utility classes |
| package.json | NPM configuration |
| pictures     | location of pictures to display |
| public       | static HTTP content |
| spec         | Jasmine tests |
