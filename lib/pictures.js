/*
 * Copyright 2017 John Coker
 * Licensed under the ISC License, https://opensource.org/licenses/ISC
 */
'use strict';

const path = require('path'),
      fs = require('fs'),
      EventEmitter = require('events');

function compareName(a, b) {

  // file name, ascending
  if (a.file.toLowerCase() < b.file.toLowerCase())
    return -1;
  if (a.file.toLowerCase() > b.file.toLowerCase())
    return 1;
  if (a.file < b.file)
    return -1;
  if (a.file > b.file)
    return 1;

  // path name, ascending
  if (a.path < b.path)
    return -1;
  if (a.path > b.path)
    return 1;

  return 0;
}

function compareShown(a, b) {

  // date, descending
  if (a.lastShown == null && b.lastShown != null)
    return 1;
  if (a.lastShown != null && b.lastShown == null)
    return -1;
  if (a.lastShown && b.lastShown) {
    if (a.lastShown < b.lastShown)
      return 1;
    if (a.lastShown > b.lastShown)
      return -1;
  }

  return compareName(a, b);
}

function compareUpdated(a, b) {

  // date, descending
  if (a.updated != null && b.updated == null) {
    if (a.updated < b.updated)
      return 1;
    if (a.updated > b.updated)
      return -1;
  }

  return compareName(a, b);
}

/**
 * One of the entries managed by the Pictures class in memory.
 * @typedef {Object} Picture
 * @property {string} file - the file name
 * @property {string} path - the file file path
 * @property {Date} updated - file mtime
 * @property {Date} lastShown - last time made current
 */

/**
 * This class manages the set of pictures in a directory and remembers current picture.
 *
 * To use, create an instance from a configuration object. All files in the directory with names
 * that match the specified extensions will be matched.
 */
class Pictures extends EventEmitter {

  /**
   * Create a set of pictures from the configuration. Pictures are <em>not</em> scanned immediately;
   * reload must be called.
   * @param {Object} [config] - the configuration object
   * @param {string} [config.pictures=.] - the pictures directory
   * @param {string[]} [config.extensions=['jpg']] - the list of file extensions
   */
  constructor(config) {
    super();

    if (config) {
      this.$dir = config.pictures;
      this.$exts = config.extensions;
    }
    if (this.$dir == null || this.$dir === '')
      this.$dir = __dirname;
    if (this.$exts == null || this.$exts.length === 0)
      this.$exts = ['jpg'];
    this.$list = [];
  }

  /**
   * The directory name for the picture files.
   * @type {string}
   */
  get directory() {
    return this.$dir;
  }

  /**
   * The file extensions matched.
   * @type {string[]}
   */
  get extensions() {
    return this.$exts;
  }

  /**
   * The number of pictures matched.
   * @type {number}
   */
  get length() {
    return this.$list.length;
  }

  /**
   * The current picture
   * @type {Picture}
   */
  get current() {
    return this.$cur;
  }

  /**
   * Change the current picture.
   * @param {Picture|string} v - the picture instance or file name
   * @return {boolean} whether the picture was changed
   */
  switch(v) {
    if (typeof v == 'string')
      v = this.byFile(v);

    if (v && this.$list.indexOf(v) >= 0) {
      if (v != this.$cur) {
        this.$cur = v;
        this.$cur.lastShown = new Date();
        this.emit('switch', v);
        return true;
      }
    }

    return false;
  }

  /**
   * Rescan the directory for files matching the list of extensions. All I/O operations are synchronous.
   */
  reload() {
    let newList = [];
    let files = fs.readdirSync(this.$dir);
    for (let i = 0; i < files.length; i++) {
      let fileName = files[i];

      if (fileName[0] == '.')
        continue;
      let ext = fileName.replace(/^.*\.([^.]*)$/, "$1").toLowerCase();
      if (this.$exts.indexOf(ext) < 0)
        continue;

      let filePath = path.join(this.$dir, '/', fileName);
      let entry;
      if (this.$list) {
        for (let j = 0; j < this.$list.length; j++) {
          if (this.$list[j].path == filePath) {
            entry = this.$list[j];
            break;
          }
        }
      }
      if (entry == null) {
        entry = {
          file: fileName,
          path: filePath
        };
      }
      let stat = fs.statSync(filePath);
      entry.updated = new Date(stat.mtime);
      newList.push(entry);
    }
    newList.sort(compareName);
    this.$list = newList;

    // reset current
    if (this.$cur != null) {
      let currentPath = this.$cur.path;
      this.$cur = undefined;
      for (let i = 0; i < this.$list.length; i++) {
        if (this.$list[i].path == currentPath) {
          this.$cur = this.$list[i];
          break;
        }
      }
    }
    if (this.$cur == null)
      this.switch(this.$list[0]);
  }

  /**
   * Get a single picture by file name.
   * @param {string} file - file name
   * @return {Picture} matching picture file
   */
  byFile(file) {
    for (let i = 0; i < this.$list.length; i++) {
      if (this.$list[i].file == file)
        return this.$list[i];
    }
  }

  /**
   * Return all pictures sorted in the specified order.
   * @param {string} order - one of <code>name</code>, <code>shown</code> or <updated>shown</updated>
   * @return {Picture[]}
   */
  sorted(order) {
    if (typeof order == 'string')
      order = order.toLowerCase();

    let compare;
    if (order == 'shown')
      compare = compareShown;
    else if (order == 'updated')
      compare = compareUpdated;
    else 
      compare = compareName;

    return this.$list.slice().sort(compare);
  }

  /**
   * Call the supplied function for each picture.
   * @param {function} f - iterator function passed the picture
   */
  forEach(f) {
    return this.$list.forEach(f);
  }
}

module.exports = Pictures;
