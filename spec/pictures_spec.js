const path = require('path'),
      fs = require('fs'),
      Pictures = require("../lib/pictures.js");

const SAMPLES = {
  pictures: path.join(__dirname, '/samples'),
  extensions: ['jpg', 'jpeg', 'png']
};

function clearConfig(dir) {
  const rmrecur = function(d) {
    fs.readdirSync(d).forEach(function(f) {
      let p = path.join(d, '/', f);
      if (fs.lstatSync(p).isDirectory())
        rmrecur(p);
      else
        fs.unlinkSync(p);
    });
    fs.rmdirSync(d);
  };

  let conf = path.join(dir, '/', '.pictureframe');
  if (fs.existsSync(conf)) {
    rmrecur(conf);
    return true;
  }

  return false;
}

function pad2(n) {
  if (n < 10)
    return '0' + n.toFixed();
  else
    return n.toFixed();
}

describe("pictures", function() {
  describe("empty", function() {
    const dir = path.join(__dirname, '/empty');
    it("prepare", function() {
      clearConfig(dir);
    });

    let pictures;
    it("setup", function() {
      pictures = new Pictures({ pictures: dir });
      pictures.reload();
    });
    it("directory", function() {
      expect(pictures.directory).toBeDefined();
      expect(path.isAbsolute(pictures.directory)).toBe(true);
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
    it("prepare", function() {
      clearConfig(SAMPLES.pictures);
    });

    let pictures;
    it("setup", function() {
      pictures = new Pictures(SAMPLES);
      pictures.reload();
    });
    it("directory", function() {
      expect(pictures.directory).toBe(SAMPLES.pictures);
    });
    it("length", function() {
      expect(pictures.length).toBe(3);
    });
    it("byFile", function() {
      expect(pictures.byFile('nonesuch.jpg')).not.toBeDefined();
      expect(pictures.byFile('watch.jpeg')).toBeDefined();
    });
    it("byIndex", function() {
      expect(pictures.byIndex(-1)).not.toBeDefined();
      expect(pictures.byIndex(0).file).toBe('balloons.png');
      expect(pictures.byIndex(1).file).toBe('drops.jpg');
      expect(pictures.byIndex(3)).not.toBeDefined();
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

  describe("history", function() {
    const minDate = new Date(new Date().getTime() - 1),
          maxDate = new Date(new Date().getTime() + 500),
          match = new RegExp('^' + minDate.getFullYear() + '-\\d{2}-\\d{2}T');

    it("prepare", function() {
      clearConfig(SAMPLES.pictures);
    });

    let pictures;
    it("setup", function() {
      pictures = new Pictures(SAMPLES);
      pictures.reload();
    });
    it("save 1", function() {
      pictures.saveHistory();
    });
    it("verify 1", function() {
      let file = path.join(pictures.configDirectory, '/', 'history.json');
      let content = fs.readFileSync(file, { encoding: 'utf-8'});
      let list = JSON.parse(content);
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBe(1);

      let entry = list[0];
      expect(typeof entry).toBe('object');
      expect(entry.file).toBe('balloons.png');
      expect(typeof entry.lastShown).toBe('string');
      expect(entry.lastShown).toMatch(match);
      expect(new Date(entry.lastShown)).toBeGreaterThan(minDate);
      expect(new Date(entry.lastShown)).toBeLessThan(maxDate);
    });
    it("save 2", function() {
      pictures.switch('drops.jpg');
      pictures.saveHistory();
    });
    it("verify 2", function() {
      let file = path.join(pictures.configDirectory, '/', 'history.json');
      let content = fs.readFileSync(file, { encoding: 'utf-8'});
      let list = JSON.parse(content);
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBe(2);

      let entry = list[0];
      expect(typeof entry).toBe('object');
      expect(entry.file).toBe('balloons.png');
      expect(typeof entry.lastShown).toBe('string');
      expect(entry.lastShown).toMatch(match);
      expect(new Date(entry.lastShown)).toBeGreaterThan(minDate);
      expect(new Date(entry.lastShown)).toBeLessThan(maxDate);

      entry = list[1];
      expect(typeof entry).toBe('object');
      expect(entry.file).toBe('drops.jpg');
      expect(typeof entry.lastShown).toBe('string');
      expect(entry.lastShown).toMatch(match);
      expect(new Date(entry.lastShown)).toBeGreaterThan(minDate);
      expect(new Date(entry.lastShown)).toBeLessThan(maxDate);
    });
  });

  describe("event", function() {
    beforeEach(function(done) {
      done();
    });
    it("prepare", function() {
      clearConfig(SAMPLES.pictures);
    });

    let pictures;
    let events = [];
    it("setup", function() {
      pictures = new Pictures(SAMPLES);
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
