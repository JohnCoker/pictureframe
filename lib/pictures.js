/*
 * Copyright 2017 John Coker
 * Licensed under the ISC License, https://opensource.org/licenses/ISC
 */
'use strict';

const path = require('path'),
      fs = require('fs'),
      EventEmitter = require('events');

const configDirName = '.pictureframe',
      historyFileName = 'history.json';

const EVENT = 'switch';

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

  return compareUpdated(a, b);
}

function compareUpdated(a, b) {

  // date, descending
  if (a.updated != null && b.updated != null) {
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
   * The "switch" event is emitted each time the current picture is changed.
   * The new picture object is passed to the callback.
   *
   * @event Pictures#switch
   * @type {Picture}
   */

  /**
   * Create a set of pictures from the configuration. Pictures are <em>not</em> scanned immediately;
   * reload must be called.
   * <p>
   * The previous configuration is read from the pictures directory. If it does not exist, no error
   * is thrown but any other errors are. All file operations are synchronous.
   * @param {Object} [config] - the configuration object
   * @param {string} [config.pictures=.] - the pictures directory
   * @param {string[]} [config.extensions=['jpg']] - the list of file extensions
   */
  constructor(config) {
    super();

    // set up state from configuration
    if (config) {
      this.$dir = config.pictures;
      if (this.$dir != null && this.$dir !== '' && !path.isAbsolute(this.$dir))
        this.$dir = path.join(__dirname, '/', this.$dir);
      this.$exts = config.extensions;
    }
    if (this.$dir == null || this.$dir === '')
      this.$dir = __dirname;
    if (this.$exts == null || !Array.isArray(this.$exts) || this.$exts.length < 1)
      this.$exts = ['jpg'];
    this.$list = [];

    // read the prior history
    try {
      let content = fs.readFileSync(this.historyFile, {
        encoding: 'utf-8'
      });
      let history = JSON.parse(content);
      if (Array.isArray(history)) {
        for (let i = 0; i < history.length; i++) {
          let file = history[i].file,
              shown = history[i].lastShown;
          if (typeof file == 'string' && file !== '' &&
              typeof shown == 'string' && /^\d{4}-\d{2}-\d{2}/.test(shown)) {
            this.$list.push({
              file: file,
              lastShown: new Date(shown)
            });
          }
        }
      }
    } catch (e) {
      if (e.code != 'ENOENT')
        throw e;
    }

    this.$reloads = 0;
  }

  /**
   * The directory path for the picture files.
   * @type {string}
   */
  get directory() {
    return this.$dir;
  }

  /**
   * The directory path for the config files.
   * @type {string}
   */
  get configDirectory() {
    return path.join(this.directory, '/', configDirName);
  }

  /**
   * The file path for the history of shown pictures.
   * @type {string}
   */
  get historyFile() {
    return path.join(this.configDirectory, '/', historyFileName);
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

  get reloads() {
    return this.$reloads;
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
        setImmediate(function(e, p) {
          e.emit(EVENT, p);
        }, this, v);
        return true;
      }
    }

    return false;
  }

  /**
   * Return the index in the current set of pictures of the specified file name.
   */
  indexOf(find) {
    if (typeof find == 'string') {
      for (let i = 0; i < this.$list.length; i++) {
        if (this.$list[i].file == find)
          return i;
      }
    }
    return this.$list.indexOf(find);
  }

  /**
   * Rescan the directory for files matching the list of extensions. All file operations are
   * synchronous.
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
      let entry = this.byFile(fileName);
      if (entry == null) {
        entry = {
          file: fileName,
          path: filePath
        };
      }
      entry.path = filePath;
      let stat = fs.statSync(filePath);
      entry.updated = new Date(stat.mtime);
      newList.push(entry);
    }
    newList.sort(compareName);
    this.$list = newList;
    delete this.$map;
    this.$reloads++;

    // reset current if set before
    if (this.$cur != null)
      this.$cur = this.byFile(this.$cur.file);
  }

  /**
   * Save the history into the <code>.pictureframe/history.json</code> file.
   * Errors are thrown and all file operations are synchronous.
   */
  saveHistory() {
    // directory must exist
    if (!fs.existsSync(this.configDirectory))
      fs.mkdirSync(this.configDirectory);

    if (Array.isArray(this.$list) && this.$list.length > 0) {
      let save = [];
      this.forEach(function(p) {
        if (p.lastShown) {
          save.push({
            file: p.file,
            lastShown: p.lastShown.toISOString()
          });
        }
      });
      fs.writeFileSync(this.historyFile, JSON.stringify(save, undefined, 2) + '\n');
    } else {
      try {
        fs.unlinkSync(this.historyFile);
      } catch (e) {}
    }
  }

  /**
   * Get a single picture by file name.
   * @param {string} file - file name
   * @return {Picture} matching picture file
   */
  byFile(file) {
    if (this.$map == null) {
      this.$map = {};
      for (let i = 0; i < this.$list.length; i++) {
        let entry = this.$list[i];
        this.$map[entry.file] = entry;
      }
    }
    return this.$map[file];
  }

  /**
   * Get a single picture by 0-based index in order by file name.
   * @param {number} i - index
   * @return {Picture} indexed picture file
   */
  byIndex(i) {
    if (typeof i != 'number' || isNaN(i) || i < 0 || this.$list.length < 1)
      return;
    return this.$list[i];
  }

  /**
   * Return all pictures sorted in the specified order.
   * @param {string} order - one of <code>name</code>, <code>shown</code> or
   * <updated>shown</updated>, which may be prefixed with "-" to invert.
   * @return {Picture[]}
   */
  sorted(order) {
    let compare;
    let reverse = false;
    if (typeof order == 'string') {
      order = order.toLowerCase();
      if (/^-/.test(order)) {
        order = order.substring(1).trim();
        reverse = true;
      }
    }
    if (order == 'shown')
      compare = compareShown;
    else if (order == 'updated')
      compare = compareUpdated;
    else 
      compare = compareName;

    if (reverse) {
      const orig = compare;
      compare = (a, b) => -orig(a, b);
    }

    return this.$list.slice().sort(compare);
  }

  /**
   * Get the list of pictures that have never been shown.
   */
  unshown() {
    return this.$list.filter(e => e.lastShown == null);
  }

  /**
   * Call the supplied function for each picture.
   * @param {function} f - iterator function passed the picture
   */
  forEach(f) {
    return this.$list.forEach(f);
  }

  /**
   * Register a listener for the "switch" event.
   * @param {Function} f - callback function
   */
  onSwitch(f) {
    this.addListener(EVENT, f);
  }
}

module.exports = Pictures;
