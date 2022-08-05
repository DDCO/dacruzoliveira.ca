'use strict'

/**
 * Module dependencies.
 */
const express = require('express');
const path = require('path');
const app = module.exports = express();
const nodemailer = require('nodemailer');
const sendinblueConfig = require('./config/sendinblue');
const bodyParser = require('body-parser');
const recaptcha = require('./components/recaptcha');
const fs = require('fs');
const http = require('http');
const https = require('https');
const helmet = require("helmet");
const compression = require('compression');

app.engine('.html', require('ejs').__express);

// Add security headers
app.use(helmet({contentSecurityPolicy:false}));

// Use compression
app.use(compression());

// middleware to parse body
app.use(bodyParser.urlencoded({ extended: true }));

// Path to our public directory
app.use(express.static(path.join(__dirname, 'public')));

// Optional since express defaults to CWD/views
app.set('views', path.join(__dirname, 'views'));

// Without this you would need to
// supply the extension to res.render()
// ex: res.render('users.html').
app.set('view engine', 'html');

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport(sendinblueConfig);

// get tls certificate
let tlsOptions;
try {
  tlsOptions = {
    key: fs.readFileSync('./config/dacruzoliveira.key'),
    cert: fs.readFileSync('./config/dacruzoliveira.crt'),
    ca: fs.readFileSync('./config/dacruzoliveira.ca-bundle')
  };
}
catch (ex) {
  tlsOptions = null;
  console.log(`Failed to read certificate, falling back to http`);
}

app.get('/', (req, res) => {
  // Set cache control header
  res.set('Cache-control', 'public, max-age=300');
  res.render('home', {});
});

app.get('/contact', (req, res) => {
  // Set cache control header
  res.set('Cache-control', 'public, max-age=300');
  res.render('contact', {});
});

app.post('/contact', async (req, res) => {
  try {
    const score = await recaptcha.requestAssessment(req);

    transporter.sendMail({
      from: `${req.body.email}`, // sender address
      to: sendinblueConfig.to, // list of receivers
      subject: "Build Request", // Subject line
      html: `${req.body.comment}`
    });
    // Set cache control header
    res.set('Cache-control', 'public, max-age=300');
    res.render('thanks', {});
  }
  catch (ex) {
    res.status(500).send(ex);
  }
});

const server = tlsOptions ? https.createServer(tlsOptions, app) : http.createServer(app);
const port = tlsOptions ? 443 : 80;
server.listen(port, () => {
  console.log(`Started listening on port ${port}`);
});
