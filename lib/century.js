/*
 * Copyright 2017 John Coker
 * Licensed under the ISC License, https://opensource.org/licenses/ISC
 */
'use strict';

const EPOCH = Object.freeze(new Date(2000, 0, 1)),
      MONTH_LEN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function dateToNumber(d) {
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

function numberToDate(n) {
  if (n == null || typeof n != 'number' || isNaN(n) || n < 1)
    return;

  return new Date(EPOCH.getFullYear(), 0, n);
}

module.exports = {
  EPOCH: EPOCH,
  dateToNumber: dateToNumber,
  numberToDate: numberToDate,
};
