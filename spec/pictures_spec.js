const path = require('path'),
      fs = require('fs'),
      Pictures = require("../lib/pictures.js");

const SAMPLES = path.join(__dirname, '/samples');

describe("pictures", function() {
  describe("empty", function() {
    let pictures;
    it("setup", function() {
      pictures = new Pictures({
        pictures: path.join(__dirname, '/empty')
      });
      pictures.reload();
    });
    it("directory", function() {
      expect(pictures.directory).toBeDefined();
      expect(pictures.directory.replace(/^.*\//, '')).toBe('empty');
    });
    it("length", function() {
      expect(pictures.length).toBe(0);
    });
    it("byFile", function() {
      expect(pictures.byFile('any.jpg')).not.toBeDefined();
    });
    it("sorted", function() {
      expect(pictures.sorted()).toEqual([]);
    });
    it("forEach", function() {
      let n = 0;
      pictures.forEach(function(p) { n++; });
      expect(n).toBe(0);
    });
  });

  describe("samples", function() {
    let pictures;
    it("setup", function() {
      pictures = new Pictures({
        pictures: SAMPLES,
        extensions: ['jpg', 'jpeg', 'png']
      });
      pictures.reload();
    });
    it("directory", function() {
      expect(pictures.directory).toBe(SAMPLES);
    });
    it("length", function() {
      expect(pictures.length).toBe(3);
    });
    it("byFile", function() {
      expect(pictures.byFile('nonesuch.jpg')).not.toBeDefined();
      expect(pictures.byFile('watch.jpeg')).toBeDefined();
    });
    it("sorted", function() {
      let sorted = pictures.sorted();
      expect(sorted).toBeDefined();
      expect(sorted.length).toBe(3);
      expect(sorted[0].file).toBe('balloons.png');
      expect(sorted[0].updated).toBeGreaterThan(new Date('2017-10-20'));
    });
    it("forEach", function() {
      let f = [];
      let shown = 0;
      pictures.forEach(function(p) {
        expect(p.file).toBeDefined();
        expect(p.path).toMatch(new RegExp('/' + p.file + '$'));
        expect(p.updated).toBeGreaterThan(new Date('2017-10-20'));
        if (p.lastShown != null)
          shown++;
        f.push(p.file);
      });
      expect(f).toEqual(['balloons.png', 'drops.jpg', 'watch.jpeg']);
      expect(shown).toBeLessThan(2);
    });
  });

  describe("event", function() {
    beforeEach(function(done) {
      done();
    });

    let pictures;
    let events = [];
    it("setup", function() {
      pictures = new Pictures({
        pictures: SAMPLES,
        extensions: ['jpg', 'jpeg', 'png']
      });
      pictures.onSwitch(function(p) {
        expect(typeof p).toBe('object');
        expect(p.file).toBeDefined();
        expect(p.lastShown).toBeDefined();
        events.push(p);
      });
      pictures.reload();
    });
    it("initial event", function() {
      expect(events.length).toBe(1);
      expect(events[0].file).toBe('balloons.png');
      expect(events[0].lastShown).toBeDefined();
    });
    it("switch same", function() {
      pictures.switch(pictures.current);
      pictures.switch('balloons.png');
      expect(events.length).toBe(1);
    });
    it("no event after same", function() {
      expect(events.length).toBe(1);
    });
    it("reload", function() {
      pictures.reload();
    });
    it("no event after reload", function() {
      expect(events.length).toBe(1);
    });
    it("switch other", function() {
      pictures.switch('drops.jpg');
    });
    it("event after switch", function() {
      expect(events.length).toBe(2);
      expect(events[1].file).toBe('drops.jpg');
      expect(events[1].lastShown).toBeDefined();
      if (events[1].lastShown.getTime() != events[0].lastShown.getTime())
        expect(events[1].lastShown).toBeGreaterThan(events[0].lastShown);
    });
  });
});
