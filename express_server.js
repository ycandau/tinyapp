//==============================================================================
// express_server.js

//------------------------------------------------------------------------------
// Constants and simulated databases

const PORT = 8080;

const urlDatabase = {
  a: 'http://www.example.com',
  b: 'http://www.examplee.com',
  b2xVn2: 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com',
};

const users = {
  u1: {
    id: 'u1',
    email: 'rfripp@example.com',
    password: 'thrak',
  },
  u2: {
    id: 'u2',
    email: 'sreich@example.com',
    password: '18musicians',
  },
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

const generateUniqueKey = (length, obj) => {
  let key = '';
  do {
    key = generateRandomString(length);
  } while (key in obj);
  return key;
};

// @todo Improve validation with regex?
const validateURL = (url) => {
  return url.includes('http') ? url : `http://${url}`;
};

// Get the user object from a request
const getCurrentUser = (req) =>
  req && req.cookies && req.cookies.user_id && req.cookies.user_id in users
    ? users[req.cookies.user_id]
    : {};

const emailIsRegistered = (email, users) =>
  Object.values(users).filter((user) => user.email === email).length > 0;

//------------------------------------------------------------------------------
// Create and initialize server

const express = require('express');
const app = express();
app.set('view engine', 'ejs');

//------------------------------------------------------------------------------
// Use middleware

const morgan = require('morgan');
app.use(morgan('dev'));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.use(express.urlencoded({ extended: false })); // primitives only

//------------------------------------------------------------------------------
// Set endpoints

// Root
app.get('/', (req, res) => {
  res.send('Hello!\n');
});

// Render page with list of all URLs
app.get('/urls', (req, res) => {
  console.log(users);
  const user = getCurrentUser(req);
  const templateVars = { urls: urlDatabase, user };
  res.render('urls_index', templateVars);
});

// Delete URL from list and redirect to list of all URLs
app.post('/urls/:id/delete', (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect('/urls');
});

// Render page to create new URL
app.get('/urls/new', (req, res) => {
  const user = getCurrentUser(req);
  res.render('urls_new', { user });
});

// Render page with single URL for editing
app.get('/urls/:id', (req, res) => {
  const id = req.params.id;
  const user = getCurrentUser(req);
  const templateVars = { id, longURL: urlDatabase[id], user };
  res.render('urls_show', templateVars);
});

// Update long URL on form submission
app.post('/urls/:id', (req, res) => {
  const id = req.params.id;
  const validURL = validateURL(req.body.longURL);
  urlDatabase[id] = validURL;
  res.redirect('/urls');
});

// Create new short URL on form submission
app.post('/urls', (req, res) => {
  const id = generateUniqueKey(6, urlDatabase);
  const validURL = validateURL(req.body.longURL);
  urlDatabase[id] = validURL;
  res.redirect(`/urls/${id}`);
});

// Redirect long URL to short URL
app.get('/u/:id', (req, res) => {
  const id = req.params.id;
  if (!(id in urlDatabase)) {
    const msg = `Invalid short URL: /u/${id}`;
    console.error(msg);
    res.status(400).send(msg); // @todo Create separate page?
    return;
  }
  res.redirect(urlDatabase[req.params.id]);
});

// GET /login: Render login page
app.get('/login', (req, res) => {
  const user = getCurrentUser(req);
  res.render('login', { user });
});

// POST /login: On login form submission
app.post('/login', (req, res) => {
  if (req.body.username) {
    res.cookie('username', req.body.username);
  }
  res.redirect('/urls');
});

// POST /logout: On logout button submission
app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

// GET /register: Render registration page
app.get('/register', (req, res) => {
  const user = getCurrentUser(req);
  res.render('register', { user });
});

// POST /register: On registration form submission
app.post('/register', (req, res) => {
  // Check validity
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send(`Invalid registration entry:<br />
      Email or password is empty`);
  }
  if (emailIsRegistered(email, users)) {
    return res.status(400).send(`Invalid registration entry:<br />
      Email already registred`);
  }
  // Register
  const id = generateUniqueKey(6, users);
  users[id] = { id, email, password };
  res.cookie('user_id', id);
  res.redirect('/urls');
});

//------------------------------------------------------------------------------

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
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
