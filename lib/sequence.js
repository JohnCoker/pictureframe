/*
 * Copyright 2017 John Coker
 * Licensed under the ISC License, https://opensource.org/licenses/ISC
 */
'use strict';

const fs = require('fs'),
      EventEmitter = require('events');

const EPOCH = Object.freeze(new Date(2000, 0, 1)),
      MONTH_LEN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const EVENT = 'newDay';

// https://en.wikipedia.org/wiki/Greatest_common_divisor#Using_Euclid.27s_algorithm
function gcd(a, b) {
  if (b === 0)
    return a;
  else
    return gcd(b, a % b);
}

function inc(len) {
  if (len > 3) {
    let p;
    for (p = Math.ceil(len / 30); gcd(len, p) > 1; p++)
      ;
    return p;
  } else
    return 1;
}

/**
 * This class manages a linear congruential sequence in which to show pictures.
 * To use, create an instance from a configuration or with a single number for the length of the
 * series. Then use the index function to traverse the sequence in a pseudo-random order.
 * <p>
 * This jumps around by using an increment which is chosen to be about 1/30th the length and
 * coprime. This results in traversing the pictures with a sequence that chooses pictures near
 * each other in order about once a month (assuming a large number of pictures).
 */
class Sequence extends EventEmitter {

  /**
   * The "newDay" event is emitted each time the date advances (passes midnight).
   * The new day number is passed to the callback.
   *
   * @event Sequence#newDay
   * @type {number}
   */

  /**
   * Create a sequence given either just the length or a configuration object with values.
   * @param {Object} config - the configuration object
   * @param {number} config.length - the sequence length
   * @param {number} [config.increment] - the increment generated
   */
  constructor(config) {
    super();

    if (config == null)
      throw new Error('Missing configuration for sequence.');
    if (typeof config == 'number')
      config = { length: config };

    // must have a length
    if (typeof config.length != 'number' || isNaN(config.length) || config.length < 0)
      throw new Error('Invalid length ' + config.length + ' for sequence.');
    this.$len = config.length;

    // optionally get the increment
    if (config.hasOwnProperty('increment')) {
      if (typeof config.increment != 'number' || isNaN(config.increment) || config.increment < 1)
        throw new Error('Invalid increment ' + config.increment + ' for sequence.');
      this.$inc = config.increment;
    } else {
      // find an increment coprime with the length
      this.$inc = inc(this.$len);
    }

    // set interval timer to watch for midnight crossing
    let timer;
    let lastDay = Sequence.dateToNumber(new Date());
    const inst = this;
    function check() {
      let today = Sequence.dateToNumber(new Date());
      if (today > lastDay) {
        lastDay = today;
        inst.emit(EVENT, today);
      }
    }
    this.on('newListener', (e, l) => {
      if (e == EVENT && timer == null) {
        check();
        timer = setInterval(check, 60 * 1000);
      }
    });
    this.on('removeListener', (e, l) => {
      if (this.listenerCount(EVENT) < 1 && timer != null) {
        try {
          clearInterval(timer);
        } catch (e) {}
        timer = null;
      }
    });
  }

  /**
   * The date used as the lowest value for translating date values to day numbers and back.
   * @type {Date}
   */
  static get EPOCH() {
    return EPOCH;
  }

  /**
   * The length of the sequence.
   * @type {number}
   */
  get length() {
    return this.$len;
  }

  /**
   * Change the length of the sequence. This will cause the increment to be recalculated.
   * @param {number} n - new length
   */
  set length(n) {
    if (n === this.$len)
      return false;
    if (typeof n != 'number' || isNaN(n) || n < 0)
      throw new Error('Invalid length ' + n + ' for sequence.');

    this.$len = n;

    // find an increment coprime with the length
    this.$inc = inc(this.$len);
  }

  /**
   * The increment chosen for the sequence.
   * @type {number}
   */
  get increment() {
    return this.$inc;
  }

  /**
   * The full configuration of the sequence.
   * @type {object}
   */
  get config() {
    return {
      length: this.$len,
      increment: this.$inc
    };
  }

  /**
   * Choose a value from the sequence and return the selected index.
   * The sequence number should be monotonically increasing and the chosen value will jump
   * around the range [0 .. length-1] without repeating until the length values
   * values have been generated.
   * @param {number} n - the sequence number
   * @return {number} 0-based index
   */
  index(n) {
    if (n > 0 && this.$len > 1)
      return (n * this.$inc) % this.$len;
    else
      return 0;
  }

  /**
   * Register a listener for the "newDay" event.
   * @param {Function} f - callback function
   */
  onNewDay(f) {
    this.addListener(EVENT, f);
  }

  /**
   * Save the sequence to a file. Any errors are thrown. All file operations are synchronous.
   * If the sequence was loaded from a file, the argument is optional.
   * @param {string} [path] - full path name to file
   */
  saveConfig(path) {
    if (path == null)
      path = this.$file;
    if (path == null || path === '')
      throw new Error('Missing file name to save sequence.');
    fs.writeFileSync(path, JSON.stringify(this.config, undefined, 2) + '\n');
  }

  /**
   * Convert a date value to the number of days since the epoch.
   * @param {Date} d - the date
   * @return {number}
   */
  static dateToNumber(d) {
    if (d == null || !(d instanceof Date))
      return;
  
    if (d < EPOCH)
      return 0;
  
    let n = 0;
  
    for (let y = EPOCH.getFullYear(); y < d.getFullYear(); y++)
      n += (y % 4 === 0) ? 366 : 365;
  
    for (let m = 0; m < d.getMonth(); m++)
      n += (d.getFullYear() % 4 === 0 && m === 1) ? 29 : MONTH_LEN[m];
  
    n += d.getDate();
  
    return n;
  }

  /**
   * Convert today's date to the number of days since the epoch.
   * @return {number}
   */
  static todayToNumber() {
    return Sequence.dateToNumber(new Date());
  }

  /**
   * Convert a day number to the date (at midnight).
   * @param {number} n - the day number
   * @return {Date}
   */
  static numberToDate(n) {
    if (n == null || typeof n != 'number' || isNaN(n) || n < 1)
      return;
  
    return new Date(EPOCH.getFullYear(), 0, n);
  }

  /**
   * Read the sequence from a file. If the file does not exist, null is returned. Any other errors are
   * thrown. All file operations are synchronous.
   * @param {string} path - full path name to file
   * @return {Sequence} loaded sequence
   */
  static loadConfig(path) {
    let content;
    try {
      content = fs.readFileSync(path, { encoding: 'utf-8' });
    } catch (e) {
      if (e.code == 'ENOENT')
        return;
      throw e;
    }

    let config = JSON.parse(content);
    let sequence = new Sequence(config);

    sequence.$file = path;
    return sequence;
  }
}

module.exports = Sequence;
