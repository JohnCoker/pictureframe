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
    });
    it("forEach", function() {
      let f = [];
      pictures.forEach(function(p) {
        f.push(p.file);
      });
      expect(f).toEqual(['balloons.png', 'drops.jpg', 'watch.jpeg']);
    });
  });
});
