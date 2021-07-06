//==============================================================================
// express_server.js

//------------------------------------------------------------------------------
// Set constants

const PORT = 8080;

const urlDatabase = {
  a: 'http://www.example.com',
  b2xVn2: 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com',
};

//------------------------------------------------------------------------------
// Helper functions

const generateRandomChar = () => {
  const n = (Math.random() * 62) >> 0;
  const code =
    n < 26
      ? n + 65 // uppercase
      : n < 52
      ? n + 71 // lowercase
      : n < 62
      ? n - 4 // digits
      : 95; // default, never set
  return String.fromCharCode(code);
};

const generateRandomString = (length) => {
  let str = '';
  for (let i = 0; i < length; i++) {
    str += generateRandomChar();
  }
  return str;
};

const generateDistinctKey = (length, obj) => {
  let key = '';
  do {
    key = generateRandomString(length);
  } while (key in obj);
  return key;
};

//------------------------------------------------------------------------------
// Create and initialize server

const express = require('express');
const app = express();
app.set('view engine', 'ejs');

//------------------------------------------------------------------------------
// Middleware

const morgan = require('morgan');
app.use(morgan('dev'));

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

//------------------------------------------------------------------------------
// Set endpoints

app.get('/', (req, res) => {
  res.send('Hello!\n');
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const templateVars = { shortURL, longURL: urlDatabase[shortURL] };
  res.render('urls_show', templateVars);
});

app.post('/urls', (req, res) => {
  const shortURL = generateDistinctKey(6, urlDatabase);
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get('/u/:shortURL', (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL]);
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

//------------------------------------------------------------------------------
// Start listening

app.listen(PORT, () => {
  console.log('--------------------------------');
  console.log(`Example app listening on port ${PORT}!`);
  console.log('--------------------------------');
});
