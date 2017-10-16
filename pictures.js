const path = require('path'),
      fs = require('fs');

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

class Pictures {
  constructor(config) {
    if (config) {
      this.$dir = config.pictures;
      this.$exts = config.extensions;
    }
    if (this.$dir == null || this.$dir === '')
      this.$dir = __dirname;
    if (this.$exts == null || this.$exts.length == 0)
      this.$exts = ['jpg'];
    this.$list = [];
  }

  get directory() {
    return this.$dir;
  }

  get extensions() {
    return this.$exts;
  }

  get current() {
    return this.$cur;
  }

  get length() {
    return this.$list.length;
  }

  switch(v) {
    if (typeof v == 'string')
      v = this.byFile(v);

    if (v && this.$list.indexOf(v) >= 0) {
      if (v != this.$cur) {
        this.$cur = v;
        this.$cur.lastShown = new Date();
        return true;
      }
    }

    return false;
  }

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
      this.$cur = this.$list[0];
  }

  byFile(file) {
    for (let i = 0; i < this.$list.length; i++) {
      if (this.$list[i].file == file)
        return this.$list[i];
    }
  }

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

  forEach(f) {
    return this.$list.forEach(f);
  }
}

module.exports = Pictures;
