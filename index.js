/*
 * Copyright 2016 John Coker for ThrustCurve.org
 * Licensed under the ISC License, https://opensource.org/licenses/ISC
 */
'use strict';

const path = require('path'),
      fs = require('fs'),
      express = require('express'),
      favicon = require('serve-favicon'),
      SSE = require('express-sse'),
      logger = require('morgan'),
      cookieParser = require('cookie-parser'),
      config = require('./config/server.js'),
      Pictures = require('./pictures.js');

const app = express(),
      router = express.Router(),
      sse = new SSE();

app.use(logger('dev'));
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(express.static(path.join(__dirname, '/public')));
app.use(cookieParser());

// set up picture state
const pictures = new Pictures(config);
pictures.reload();

// main page is dynamic
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
        midnight.setDate(midnight.getDate(-1));
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

router.get(['/', '/index.html', '/manage', '/manage.html'], function(req, res, next) {

  var feedback = [];

  // change the current picture
  if (req.query.hasOwnProperty('switch') && pictures.switch(req.query.switch)) {
    let encoded = encodeHTML(pictures.current.file);
    feedback.push(`Now showing ${encoded}.`);
  }

  // reset the sequence
  if (req.query.hasOwnProperty('reset')) {
    feedback.push('Picture sequence reset.');
  }

  // resume normal sequence
  if (req.query.hasOwnProperty('resume')) {

    if (pictures.current) {
      let encoded = encodeHTML(pictures.current.file);
      feedback.push('Resumed sequence with ${encoded}.');
    }
  }

  // collect the sort order
  let sort, setSort = false;
  if (req.query.hasOwnProperty('sort') &&
      /^(name|shown|updated)$/.test(req.query.sort.toLowerCase())) {
    sort = req.query.sort;
    res.append('Set-Cookie', 'sort=' + sort);
  } else {
    sort = req.cookies.sort;
  }

  // generate the page
  var parts = [];
  parts.push(manageHeader);
  parts.push(' <div class="container">\n');

  if (feedback.length > 0) {
    for (let i = 0; i < feedback.length; i++) {
      parts.push(`  <div class="alert alert-info" role="alert">
   <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
   ${feedback[i]}
  </div>
`);
    }
  }

  if (pictures.length < 1) {
    parts.push('<p>No pictures in the frame yet; use <strong>Manage</strong> | <strong>Upload Pictures</strong> above to change that.</p>\n');
    parts.push('<img class="no-pictures" src="images/no-pictures.jpg" />\n');
  } else {
    let current = pictures.current;
    if (current) {
      let caption = formatCaption(current, 'showing now');
      parts.push(`  <div class="row">
     <div class="col-sm-12 picture current">
      <img src="/picture/current" />
      <p class="caption">${caption}</p>
     </div>
    </div>\n`);
    }
  
    if (pictures.length > 1 || pictures.length === 1 && current == null) {
      parts.push('  <div class="row">\n');
      let col = 0;
      let sorted = pictures.sorted(sort);
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i] == current)
          continue;
  
        if (col >= 12) {
          parts.push('  </div>\n');
          parts.push('  <div class="row">\n');
          col = 0;
        }
        parts.push('   <div class="col-sm-3 picture">\n');
        let encoded = encodeURIComponent(sorted[i].file);
        parts.push(`    <a href="?switch=${encoded}"><img src="/thumbnail/${encoded}" /></a>\n`);
        let caption = formatCaption(sorted[i]);
        parts.push(`    <p class="caption">${caption}</p>\n`);
        parts.push('   </div>\n');
        col += 3;
      }
      if (col < 12)
        parts.push(`   <div class="col-sm-${12 - col}">&nbsp;</div>\n`);
      parts.push('  </div>\n');

      if (sorted.length > 5)
        parts.push('  <p style="text-align: center;"><a href="#navbar">Back to Top</p>\n');
    }
  }

  parts.push(' </div>\n');
  parts.push(manageFooter);

  res.status(200)
     .type('html');
  for (let i = 0; i < parts.length; i++)
    res.write(parts[i]);
  res.end();
});

router.get('/frame', function(req, res, next) {
  res.redirect(301, '/frame.html');
});

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

router.get(['/picture/:file', '/thumbnail/:file'], function(req, res, next) {
  let found;
  if (req.params.file != null && req.params.file !== '')
    found = pictures.byFile(req.params.file);
  if (found)
    res.sendFile(found.path);
  else
    res.status(404).send();
});

router.get(['/sse', '/sse.html'], sse.init);

pictures.on('switch', function(cur) {
  sse.send(cur == null ? "none" : cur.file, 'switch');
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
