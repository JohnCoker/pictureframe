/*
 * Copyright 2017 John Coker
 * Licensed under the ISC License, https://opensource.org/licenses/ISC
 */
'use strict';

const path = require('path'),
      fs = require('fs'),
      express = require('express'),
      favicon = require('serve-favicon'),
      multer = require('multer'),
      SSE = require('express-sse'),
      logger = require('morgan'),
      cookieParser = require('cookie-parser'),
      sharp = require('sharp'),
      config = require('./config/server.js'),
      Pictures = require('./lib/pictures.js'),
      Sequence = require('./lib/sequence.js');

const app = express(),
      router = express.Router(),
      sse = new SSE();

app.use(logger('dev'));
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(express.static(path.join(__dirname, '/public')));
app.use(cookieParser());

// set up picture manage
const pictures = new Pictures(config);
pictures.reload();
pictures.saveHistory();

// set up the sequence
const sequenceFile = path.join(pictures.configDirectory, '/sequence.json'),
      sequence = Sequence.loadConfig(sequenceFile) || new Sequence(pictures.length);
sequence.length = pictures.length;
sequence.saveConfig(sequenceFile);

function todaysPicture() {
  let i = sequence.index(Sequence.todayToNumber());
  if (pictures.switch(pictures.byIndex(i))) {
    pictures.saveHistory();
    return true;
  }
  return false;
}
sequence.onNewDay(todaysPicture);
todaysPicture();

/*
 * The manage route shows a page with the current picture at the top and the other ones in a table below.
 * The table is dynamic, but we use a static header and footer surrounding it.
 */
const manageRoot = path.join(__dirname + '/public/manage/'),
      manageHeader = fs.readFileSync(path.join(manageRoot, 'header.incl'), 'utf8'),
      manageFooter = fs.readFileSync(path.join(manageRoot, 'footer.incl'), 'utf8');

function formatCaption(picture, when) {

  if (when == null) {
    if (!picture.lastShown)
      when = 'never shown';
    else {
      let midnight = new Date();
      midnight.setHours(0, 0, 0, 0);
      let ago = 0;
      while (picture.lastShown < midnight) {
        midnight.setDate(midnight.getDate() - 1);
        ago++;
      }
  
      if (ago < 1)
        when = 'shown today';
      else if (ago == 1)
        when = 'shown yesterday';
      else
        when = `shown ${ago}d ago`;
    }
  }

  return encodeHTML(picture.file) + ', ' + when;
}

function reloadPictures() {
  pictures.reload();
  todaysPicture();
}

function template(source, params) {
  return source.replace(/{{ *([a-z]+) *}}/g, function(m, v) {
    if (params.hasOwnProperty(v))
      return params[v];
    else
      return '';
  });
}

router.get(['/', '/index.html', '/manage', '/manage.html'], function(req, res, next) {

  var feedback = [];

  // change the current picture
  if (req.query.hasOwnProperty('switch') && pictures.switch(req.query.switch)) {
    let encoded = encodeHTML(pictures.current.file);
    feedback.push({ severity: 'success', message: `Switched to ${encoded}.` });
  }

  // reload the pictures
  if (req.query.hasOwnProperty('reload')) {
    reloadPictures();
    feedback.push({ severity: 'success', message: `Picture files reloaded (${pictures.length}).` });
  }

  // resume normal sequence
  if (req.query.hasOwnProperty('resume')) {
    if (todaysPicture()) {
      let encoded = encodeHTML(pictures.current.file);
      feedback.push({ severity: 'success', message: `Resumed sequence with ${encoded}.` });
    }
  }

  // collect the sort order
  let sort;
  if (req.query.hasOwnProperty('sort') &&
      /^(name|shown|updated)$/.test(req.query.sort.toLowerCase())) {
    sort = req.query.sort;
    res.append('Set-Cookie', 'sort=' + sort);
  } else {
    sort = req.cookies.sort;
  }

  // parameters available for the template
  let now = new Date();
  let params = {
    timezone: now.getTimezoneOffset(),
    time: now.getTime(),
    uploads: config.uploads,
  };
  if (config.uploads) {
    let es = "";
    config.extensions.forEach(function(e) {
      if (es.length > 0)
        es += ',';
      es += '.' + e;
    });
    params.accept = es;
  }
  console.log(params);

  // generate the page
  var parts = [];
  parts.push(template(manageHeader, params));
  parts.push(' <div class="container">\n');

  parts.push(`  <div id="feedback">\n`);
  if (feedback.length > 0) {
    for (let i = 0; i < feedback.length; i++) {
      parts.push(`   <div class="alert alert-${feedback[i].severity}" role="alert">
    <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
    ${feedback[i].message}
   </div>
`);
    }
  }
  parts.push('  </div>\n');

  if (pictures.length < 1) {
    parts.push('<p>No pictures in the frame yet; use <strong>Manage</strong> | <strong>Upload Pictures</strong> above to change that.</p>\n');
    parts.push('<img class="no-pictures" src="images/no-pictures.jpg" />\n');
  } else {
    const cols = 12, span = 3;

    // current picture is full width
    let current = pictures.current;
    if (current) {
      let caption = formatCaption(current, 'showing now');
      parts.push(`  <div class="row current">
     <div class="col-sm-${cols} picture current">
      <img src="/picture/current?d=${Sequence.todayToNumber()}" />
      <p class="caption">${caption}</p>
     </div>
    </div>\n`);
    }

    // other pictures in a grid below
    if (pictures.length > 1 || pictures.length === 1 && current == null) {
      parts.push('  <div class="row other">\n');
      let rows = 1, col = 0;
      let sorted = pictures.sorted(sort);
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i] == current)
          continue;
  
        if (col >= cols) {
          parts.push('  </div>\n');
          parts.push('  <div class="row">\n');
          col = 0;
          rows++;
        }
        parts.push(`   <div class="col-sm-${span} picture other">\n`);
        let encoded = encodeURIComponent(sorted[i].file);
        parts.push(`    <a class="switch" title="click to switch" href="?switch=${encoded}"><img src="/thumbnail/${encoded}" /></a>\n`);
        let caption = formatCaption(sorted[i]);
        parts.push(`    <p class="caption">${caption}</p>\n`);
        parts.push('   </div>\n');
        col += span;
      }
      if (col < cols)
        parts.push(`   <div class="col-sm-${cols - col}">&nbsp;</div>\n`);
      parts.push('  </div>\n');

      if (rows > 2)
        parts.push('  <p style="text-align: center;"><a href="#navbar">Back to Top</p>\n');
    }
  }

  parts.push(' </div>\n');
  parts.push(template(manageFooter, params));

  res.status(200)
     .type('html');
  for (let i = 0; i < parts.length; i++)
    res.write(parts[i]);
  res.end();
});

/*
 * The frame route shows a page with the current picture full screen.
 */
router.get('/frame', function(req, res, next) {
  res.redirect(301, '/frame.html');
});

/*
 * The /picture/current route returns just the current image.
 */
router.get(['/picture/current', '/thumbnail/current'], function(req, res, next) {
  if (pictures.current) {
    res.sendFile(pictures.current.path, {
      lastModified: false,
      cacheControl: false,
      headers: {
        'Last-Modified': pictures.current.lastShown.toUTCString(),
        'Cache-Control': 'must-revalidate',
        'X-Current-Picture': pictures.current.file
      }
    });
  } else
    res.status(404).send();
});

/*
 * The /picture/<file> route returns a single picture image, full size.
 */
router.get('/picture/:file', function(req, res, next) {
  let found;
  if (req.params.file != null && req.params.file !== '')
    found = pictures.byFile(req.params.file);
  if (found)
    res.sendFile(found.path);
  else
    res.status(404).send();
});

/*
 * The /thumbnail/<file> route returns a single picture image, reduced size.
 */
router.get('/thumbnail/:file', function(req, res, next) {
  let found;
  if (req.params.file != null && req.params.file !== '')
    found = pictures.byFile(req.params.file);
  if (found) {
    fs.readFile(found.path, function(err, data) {
      if (err) {
        if (err.code == 'ENOENT' || err.code == 'EISDIR')
          res.status(404).send();
        else if (err.code == 'EACCESS')
          res.status(403).send();
        else
          res.status(500).send(err.toString());
        return;
      }

      const image = sharp(data);
      image
        .metadata()
        .then(info => {
          let height = 1080 / 4;
          let width = Math.round((info.width / info.height) * height);
          image
            .resize(width, height, {
              kernel: sharp.kernel.lanczos2
            })
            .toBuffer(function(err, data) {
              if (err) {
                res.status(500).send(err.toString());
                return;
              }
              res.type('image/' + info.format)
                .send(data);
            });
        })
        .catch(err => {
          res.status(500).send(err.toString());
        });
    });
  } else
    res.status(404).send();
});

/*
 * The /sse route sets up a server-sent events connection.
 */
router.get(['/sse', '/sse.html'], sse.init);

pictures.on('switch', function(cur) {
  sse.send(cur == null ? "none" : cur.file, 'switch');
});

/*
 * POST to /upload will upload a set of files.
 */
function noUploadResponse(res) {
  res.status(403).send('Picture upload not supported.');
}

function noSuchFileResponse(res) {
  res.status(404).send('File does not exist.');
}

function badExtensionResponse(res) {
  res.status(400).send('Picture file extension not supported.');
}

function errorResponse(res, err) {
  if (err != null && err.code == 'EACCES')
    res.status(403).send('Permission Denied.');
  else if (err != null && err.code == 'ENOENT')
    res.status(404).send('No such file or directory.');
  else
    res.status(500).send(err);
}

const upload = multer({
  dest: '/tmp',
});

router.post('/upload', upload.array('upload'), function(req, res, next) {
  if (!config.uploads) {
    noUploadResponse(res);
    return;
  }

  if (req.files == null || req.files.length < 1) {
    res.status(400).send('No files to upload.');
    return;
  }
  const total = req.files.length;

  let success = 0, failed = 0;
  let firstFile;
  for (let i = 0; i < total; i++) {
    let upload = req.files[i];

    let file = upload.originalname;
    if (!firstFile)
      firstFile = file;
    let ext = file.replace(/^.*\.([a-z]*)$/i, '$1').toLowerCase();
    if (ext === '' || config.extensions.indexOf(ext) < 0) {
      if (total == 1) {
        badExtensionResponse(res);
        return;
      }
      failed++;
      continue;
    }

    let p = path.join(pictures.directory, '/', file);
    try {
      fs.renameSync(upload.path, p);
      success++;
    } catch (err) {
      failed++;
      fs.unlink(upload.path);
    }
  }

  if (total == 1 && failed > 0)
    res.status(400).send('File upload failed (' + firstFile + ').');
  else if (total == 1)
    res.status(200).send('File upload succeeded (' + firstFile + ').');
  else if (failed > 0 && success < 1)
    res.status(400).send(failed + ' file uploads failed.');
  else if (failed > 0)
    res.status(200).send(success + '/' + total + ' file uploads succeeded.');
  else
    res.status(200).send(success + ' file uploads succeeded.');

  if (success > 0)
    reloadPictures();
});

/*
 * PUT of /picture/* will create/update a file.
 */
router.put('/picture/:file', function(req, res, next) {
  if (!config.uploads) {
    noUploadResponse(res);
    return;
  }

  let file = req.params.file.replace(/^[^\/]*\//, '');
  let ext = file.replace(/^.*\.([a-z]*)$/i, '$1').toLowerCase();
  if (ext === '' || config.extensions.indexOf(ext) < 0) {
    badExtensionResponse(res);
    return;
  }

  let data = new Buffer('');
  req.on('data', function(chunk) {
    data = Buffer.concat([data, chunk]);
  }).on('end', function() {
    let p = path.join(pictures.directory, '/', file);
    fs.writeFile(p, data, function(err) {
      if (err)
        errorResponse(res, err);
      else
        res.status(201).send();
      reloadPictures();
    });
  }).on('error', function(err) {
    errorResponse(res, err);
  });
});

/*
 * DELETE of /picture/* will remove a file.
 */
router.delete('/picture/:file', function(req, res, next) {
  if (!config.uploads) {
    noUploadResponse(res);
    return;
  }

  let p = pictures.byFile(req.params.file);
  if (p == null) {
    noSuchFileResponse(res);
    return;
  }
  fs.unlink(p.path, function(err) {
    if (err)
      errorResponse(res, err);
    else
      res.status(200).send();
    reloadPictures();
  });
});

app.use('/', router);

// handle other routes as 404
app.use(function(req, res, next) {
  res.status(404).send();
});

// handle internal errors
app.use(function(err, req, res, next) {
  let status = err.status || 500;
  let message = encodeHTML(err.message) || 'Unknown error';
  let body = `<!DOCTYPE html>
<html>
<head>
 <title>Server Error</title>
</head>
<body>
 <h1>Server Error</h1>
 <ul>
 <li>URL: ${req.url}</li>
 <li>status: ${status}</li>
 <li>message: ${message}</li>
 </ul>
`;

  if (err && err.stack)
    body += ' <pre>\n' + encodeHTML(err.stack) + '\n</pre>\n';

  body += `
</body>
</html>`;

  res.status(status).send(body);
});

function encodeHTML(s) {
  if (s == null || s === '')
    return '';
  return s.replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
}

module.exports = app;
