const path = require('path'),
      fs = require('fs');

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

module.exports = {
  SAMPLES,
  clearConfig,
};

