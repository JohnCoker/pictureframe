const century = require("../lib/century.js");

describe("centry", function() {
  describe("EPOCH", function() {
    it("must be defined", function() {
      expect(century.EPOCH).toBeDefined();
      expect(typeof century.EPOCH).toBe('object');
      expect(century.EPOCH instanceof Date).toBe(true);
    });
  });

  describe("dateToNumber", function() {
    it("must not convert invalid values", function() {
      expect(century.dateToNumber()).not.toBeDefined();
      expect(century.dateToNumber(new Date(1900, 0, 1))).toBe(0);
    });
    it("must start at 1", function() {
      expect(century.dateToNumber(century.EPOCH)).toBe(1);
    });
    it("must handle epoch year", function() {
      expect(century.dateToNumber(new Date(2000, 1, 28))).toBe(59);
      expect(century.dateToNumber(new Date(2000, 1, 29))).toBe(60);
      expect(century.dateToNumber(new Date(2000, 2, 1))).toBe(61);
    });
    it("must handle leap year", function() {
      const n0 = century.dateToNumber(new Date(2003, 11, 31));
      expect(n0).toBe(366 + 365 + 365 + 365);
      expect(century.dateToNumber(new Date(2004, 1, 28))).toBe(n0 + 59);
      expect(century.dateToNumber(new Date(2004, 1, 29))).toBe(n0 + 60);
      expect(century.dateToNumber(new Date(2004, 2, 1))).toBe(n0 + 61);
    });
    it("must handle regular years", function() {
      const n0 = century.dateToNumber(new Date(2002, 11, 31));
      expect(n0).toBe(366 + 365 + 365);
      expect(century.dateToNumber(new Date(2003, 1, 28))).toBe(n0 + 59);
      expect(century.dateToNumber(new Date(2003, 2, 1))).toBe(n0 + 60);
    });
    it("must handle entire day", function() {
      const n0 = century.dateToNumber(new Date(2017, 9, 19));
      expect(n0).toBeGreaterThan(17 * 365);
      expect(n0).toBeLessThan(18 * 365);
      for (let i = 0; i < 1000; i++) {
        let h = Math.round(Math.random() * 23);
        let m = Math.round(Math.random() * 59);
        let s = Math.round(Math.random() * 59);
        expect(century.dateToNumber(new Date(2017, 9, 19, h, m, s))).toBe(n0);
      }
    });
  });

  describe("numberToDate", function() {
    it("must not convert invalid values", function() {
      expect(century.numberToDate()).not.toBeDefined();
      expect(century.numberToDate(-1)).not.toBeDefined();
      expect(century.numberToDate('one')).not.toBeDefined();
      expect(century.numberToDate(NaN)).not.toBeDefined();
    });
    it("must start at 1", function() {
      expect(century.numberToDate(1)).toEqual(century.EPOCH);
    });
    it("must handle epoch year", function() {
      expect(century.numberToDate(59)).toEqual(new Date(2000, 1, 28));
      expect(century.numberToDate(60)).toEqual(new Date(2000, 1, 29));
      expect(century.numberToDate(61)).toEqual(new Date(2000, 2, 1));
    });
    it("must handle leap year", function() {
      const n0 = century.dateToNumber(new Date(2003, 11, 31));
      expect(century.numberToDate(n0 + 59)).toEqual(new Date(2004, 1, 28));
      expect(century.numberToDate(n0 + 60)).toEqual(new Date(2004, 1, 29));
      expect(century.numberToDate(n0 + 61)).toEqual(new Date(2004, 2, 1));
    });
    it("must handle regular years", function() {
      const n0 = century.dateToNumber(new Date(2002, 11, 31));
      expect(century.numberToDate(n0 + 59)).toEqual(new Date(2003, 1, 28));
      expect(century.numberToDate(n0 + 60)).toEqual(new Date(2003, 2, 1));
    });
  });
});
