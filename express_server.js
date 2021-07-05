//==============================================================================
// express_server.js

//------------------------------------------------------------------------------
// Require modules

const express = require('express');

//------------------------------------------------------------------------------
// Set constants

const PORT = 8080;

const urlDatabase = {
  b2xVn2: 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com',
};

//------------------------------------------------------------------------------
// Create and initialize server

const app = express();
app.set('view engine', 'ejs');

//------------------------------------------------------------------------------
// Set endpoints

app.get('/', (req, res) => {
  res.send('Hello!\n');
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const templateVars = { shortURL, longURL: urlDatabase[shortURL] };
  res.render('urls_show', templateVars);
});

//------------------------------------------------------------------------------
// Start listening

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
