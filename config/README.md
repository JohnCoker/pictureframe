# Setup and Configuration

This directory contains `server.js` which is used to the Node.js application and instructions for setting up the
picture frame on various SBCs.
 - for the Raspberry Pi 3 see the `raspberrypi` directory,
 - for the Asus TinkerBoard see `tinkerboard`.

Any computer capable of running Node.js 6+ and a browser in kiosk mode should work.

## Pictures Location

You can edit `server.js` to change the location of the pictures directory. 
On many distros a "Pictures" directory is created in the home directory.
To use that instead, find the full path to directory you want to use:
```
echo ~/Pictures
/home/username/Pictures
```
Then edit server.js to use that directory:
```
  /**
   * Directory in which picture files are located.
   */
  pictures: "/home/username/Pictures",
```
Don't forget to quote the path and don't accidentally remove the comma at the end of the line.

## Picture Files

Only pictures located directly in the pictures directory are scanned; sub-directories are not.

Any file that ends with one of the extensions specified in `server.js` is assumed to be a picture image.
File extensions should be specified as lower-case, but are case-insensitive when comparing file names.

## Security Warning

The web server is accessed without a password, so any picture files located in the configured directory are
readable by anyone who has web access to the server.

Moreover, anyone will be able to add, overwrite or remove the picture files over the web.
If you want to prevent this, disable uploads in `server.js`:
```
  /**
   * If true, POST, PUT and DELETE are supported to upload and remove images.
   */
  uploads: false,
```
Don't accidentally remove the comma at the end of the line.

It is assumed that nothing irretrievable is located on the server pictures directory and the server is not accessible
on a public network. If either of these assumptions is false you may not want to use this program, at least not without
taking further measures to secure it.
