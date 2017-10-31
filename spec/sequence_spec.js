const fs = require('fs'),
      Sequence = require("../lib/sequence.js");

describe("sequence", function() {
  describe("EPOCH", function() {
    it("must be defined", function() {
      expect(Sequence.EPOCH).toBeDefined();
      expect(typeof Sequence.EPOCH).toBe('object');
      expect(Sequence.EPOCH instanceof Date).toBe(true);
    });
  });

  describe("dateToNumber", function() {
    it("must not convert invalid values", function() {
      expect(Sequence.dateToNumber()).not.toBeDefined();
      expect(Sequence.dateToNumber(new Date(1900, 0, 1))).toBe(0);
    });
    it("must start at 1", function() {
      expect(Sequence.dateToNumber(Sequence.EPOCH)).toBe(1);
    });
    it("must handle epoch year", function() {
      expect(Sequence.dateToNumber(new Date(2000, 1, 28))).toBe(59);
      expect(Sequence.dateToNumber(new Date(2000, 1, 29))).toBe(60);
      expect(Sequence.dateToNumber(new Date(2000, 2, 1))).toBe(61);
    });
    it("must handle leap year", function() {
      const n0 = Sequence.dateToNumber(new Date(2003, 11, 31));
      expect(n0).toBe(366 + 365 + 365 + 365);
      expect(Sequence.dateToNumber(new Date(2004, 1, 28))).toBe(n0 + 59);
      expect(Sequence.dateToNumber(new Date(2004, 1, 29))).toBe(n0 + 60);
      expect(Sequence.dateToNumber(new Date(2004, 2, 1))).toBe(n0 + 61);
    });
    it("must handle regular years", function() {
      const n0 = Sequence.dateToNumber(new Date(2002, 11, 31));
      expect(n0).toBe(366 + 365 + 365);
      expect(Sequence.dateToNumber(new Date(2003, 1, 28))).toBe(n0 + 59);
      expect(Sequence.dateToNumber(new Date(2003, 2, 1))).toBe(n0 + 60);
    });
    it("must handle entire day", function() {
      const n0 = Sequence.dateToNumber(new Date(2017, 9, 19));
      expect(n0).toBeGreaterThan(17 * 365);
      expect(n0).toBeLessThan(18 * 365);
      for (let i = 0; i < 1000; i++) {
        let h = Math.round(Math.random() * 23);
        let m = Math.round(Math.random() * 59);
        let s = Math.round(Math.random() * 59);
        expect(Sequence.dateToNumber(new Date(2017, 9, 19, h, m, s))).toBe(n0);
      }
    });
  });

  describe("todayToNumber", function() {
    it("must match today", function() {
      let n = Sequence.todayToNumber();
      expect(n).toBeDefined();
      expect(n).toBeGreaterThan(0);
      expect(n).toBe(Sequence.dateToNumber(new Date()));
    });
  });

  describe("numberToDate", function() {
    it("must not convert invalid values", function() {
      expect(Sequence.numberToDate()).not.toBeDefined();
      expect(Sequence.numberToDate(-1)).not.toBeDefined();
      expect(Sequence.numberToDate('one')).not.toBeDefined();
      expect(Sequence.numberToDate(NaN)).not.toBeDefined();
    });
    it("must start at 1", function() {
      expect(Sequence.numberToDate(1)).toEqual(Sequence.EPOCH);
    });
    it("must handle epoch year", function() {
      expect(Sequence.numberToDate(59)).toEqual(new Date(2000, 1, 28));
      expect(Sequence.numberToDate(60)).toEqual(new Date(2000, 1, 29));
      expect(Sequence.numberToDate(61)).toEqual(new Date(2000, 2, 1));
    });
    it("must handle leap year", function() {
      const n0 = Sequence.dateToNumber(new Date(2003, 11, 31));
      expect(Sequence.numberToDate(n0 + 59)).toEqual(new Date(2004, 1, 28));
      expect(Sequence.numberToDate(n0 + 60)).toEqual(new Date(2004, 1, 29));
      expect(Sequence.numberToDate(n0 + 61)).toEqual(new Date(2004, 2, 1));
    });
    it("must handle regular years", function() {
      const n0 = Sequence.dateToNumber(new Date(2002, 11, 31));
      expect(Sequence.numberToDate(n0 + 59)).toEqual(new Date(2003, 1, 28));
      expect(Sequence.numberToDate(n0 + 60)).toEqual(new Date(2003, 2, 1));
    });
  });

  describe("initial setup", function() {
    describe("empty", function() {
      it("number", function() {
        let seq = new Sequence(0);
        expect(seq.length).toBe(0);
        expect(seq.increment).toBe(1);
      });
      it("config", function() {
        let seq = new Sequence({ length: 0, increment: 30 });
        expect(seq.length).toBe(0);
        expect(seq.increment).toBe(30);
      });
    });
    describe("with length value", function() {
      for (let i = 0; i < 100; i++) {
        it("try " + (i + 1), function() {
          let seq = new Sequence(22);
          expect(seq.length).toBe(22);
  
          expect(seq.increment).toBe(13);
  
          expect(typeof seq.increment).toBe('number');
          expect(seq.config).toEqual({ length: 22, increment: 13 });
        });
      }
    });
    describe("with config length only", function() {
      for (let i = 0; i < 100; i++) {
        it("try " + (i + 1), function() {
          let seq = new Sequence({ length: 34 });
          expect(seq.length).toBe(34);
          expect(seq.increment).toBe(19);
          expect(seq.config).toEqual({ length: 34, increment: 19 });
        });
      }
    });
    describe("with full config", function() {
      it("object", function() {
        let config = { length: 47, increment: 24 };
        let seq = new Sequence(config);
        expect(seq.length).toBe(47);
        expect(seq.increment).toBe(24);
        expect(seq.config).toEqual(config);
      });
    });
  });

  describe("set length", function() {
    describe("longer", function() {
      let seq = new Sequence(50);
      it("setup", function() {
        expect(seq.length).toBe(50);
        expect(seq.increment).toBe(27);
      });
      it("resize", function() {
        seq.length = 100;
        expect(seq.length).toBe(100);
        expect(seq.increment).toBe(51);
      });
    });
    describe("shorter", function() {
      let seq = new Sequence(121);
      it("setup", function() {
        expect(seq.length).toBe(121);
        expect(seq.increment).toBe(61);
      });
      it("resize", function() {
        seq.length = 65;
        expect(seq.length).toBe(65);
        expect(seq.increment).toBe(33);
      });
    });
  });

  describe("index", function() {
    for (let length = 3; length < 1000; length = Math.floor(length * 1.414)) {
      describe("length " + length, function() {
        let seq = new Sequence(length);
        it("setup", function() {
          expect(seq.length).toBe(length);
          expect(seq.increment).toBeGreaterThan(0);
          expect(seq.increment).toBeGreaterThan(length / 2 - 1);
          expect(seq.increment).toBeLessThan(length);
          expect(seq.increment).toMatch(/^\d+$/);
        });
        let counts = [];
        for (let i = 0; i < length; i++)
          counts[i] = 0;

        const n0 = 1 + Math.floor(Math.random() * 100);
        function loop() {
          for (let i = 0; i < length; i++) {
            let n = seq.index(n0 + i);
            expect(n).toBeGreaterThan(-1);
            expect(n).toBeLessThan(length);
            expect(n).toMatch(/^\d+$/);
            counts[n]++;
          }
        }

        it("first loop", function() {
          loop();
          for (let i = 0; i < length; i++)
            expect(counts[i]).toBe(1);
        });
        it("second loop", function() {
          loop();
          for (let i = 0; i < length; i++)
            expect(counts[i]).toBe(2);
        });
      });
    }
  });

  describe("save/load", function() {
    const path = "/tmp/sequence.json";
    it("prepare", function() {
      if (fs.existsSync(path))
        fs.unlink(path);
    });

    it("no file", function() {
      let sequence = Sequence.loadConfig(path);
      expect(sequence).not.toBeDefined();
    });

    let orig;
    it("setup", function() {
      let sequence = new Sequence(77);
      orig = sequence.config;
      expect(orig.length).toBe(77);
      sequence.saveConfig(path);
    });
    it("load/save", function() {
      let sequence = Sequence.loadConfig(path);
      expect(sequence).toBeDefined();
      expect(sequence.length).toBe(orig.length);
      expect(sequence.increment).toBe(orig.increment);
      sequence.saveConfig();
    });
    it("reload", function() {
      let sequence = Sequence.loadConfig(path);
      expect(sequence).toBeDefined();
      expect(sequence.length).toBe(orig.length);
      expect(sequence.increment).toBe(orig.increment);
    });
  });
});
