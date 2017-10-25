/*
 * Copyright 2017 John Coker
 * Licensed under the ISC License, https://opensource.org/licenses/ISC
 */
'use strict';

const EPOCH = Object.freeze(new Date(2000, 0, 1)),
      MONTH_LEN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// https://en.wikipedia.org/wiki/Greatest_common_divisor#Using_Euclid.27s_algorithm
function gcd(a, b) {
  if (b == 0)
    return a;
  else
    return gcd(b, a % b);
}

/**
 * This class manages a linear congruential sequence in which to show pictures.
 *
 * To use, create an instance from a configuration or with a single number for the length of the series.
 * Then use the index function to traverse the sequence in a pseudo-random order.
 */
class Sequence {

  /**
   * Create a sequence given either just the length or a configuration object with up to three values.
   * @param {Object} config - the configuration object
   * @param {number} config.length - the sequence length
   * @param {number} [config.increment] - the increment generated
   * @param {number} [config.intitial] - the initial value chosen
   */
  constructor(config) {
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
      // find a coprime about half the length
      if (this.$len > 3) {
        let p;
        for (p = Math.ceil(this.$len / 2); gcd(this.$len, p) > 1; p++)
          ;
        this.$inc = p;
      } else
        this.$inc = 1;
    }

    // optionally get the initial choice
    if (config.hasOwnProperty('initial')) {
      if (typeof config.initial != 'number' || isNaN(config.initial) || config.initial < 0)
        throw new Error('Invalid initial ' + config.initial + ' for sequence.');
      this.$init = config.initial;
      if (this.$len > 0)
        this.$init = this.$init % this.$len;
      else
        this.$init = 0;
    } else {
      // pick a random start
      if (this.$len > 1)
        this.$init = Math.floor(Math.random() * this.$len);
      else
        this.$init = 0;
    }
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
   * The increment chosen for the sequence.
   * @type {number}
   */
  get increment() {
    return this.$inc;
  }

  /**
   * The initial value chosen for the sequence.
   * @type {number}
   */
  get initial() {
    return this.$init;
  }

  /**
   * The full configuration of the sequence.
   * @type {object}
   */
  get config() {
    return {
      length: this.$len,
      increment: this.$inc,
      initial: this.$init
    };
  }

  /**
   * Reset the sequence by calculating a new initial value.
   */
  reset() {
    if (this.$inc > 3)
      this.$init = (this.$init + 1 + Math.floor(Math.random() * (this.$inc / 2))) % this.$len;
    else if (this.$len > 1) {
      let prior = this.$init;
      while (this.$init == prior)
        this.$init = Math.floor(Math.random() * this.$len);
    }
  }

  /**
   * Choose a value from the sequence at the specified index.
   * The index should be monotonically increasing and the chosen value will jump
   * around the range [0 .. length-1] without repeating until the length values
   * values have been generated.
   * @param {number} n - the index
   */
  index(n) {
    if (n > 0 && this.$len > 1)
      return (this.$init + n * this.$inc) % this.$len;
    else
      return this.$init;
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
   * Convert a day number to the date (at midnight).
   * @param {number} n - the day number
   * @return {Date}
   */
  static numberToDate(n) {
    if (n == null || typeof n != 'number' || isNaN(n) || n < 1)
      return;
  
    return new Date(EPOCH.getFullYear(), 0, n);
  }
}

module.exports = Sequence;
