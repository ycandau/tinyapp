//==============================================================================
// express_server.js
//==============================================================================

//------------------------------------------------------------------------------
// Constants and simulated databases

const port = 8080;

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
  u3: {
    id: 'u3',
    email: 'a@b',
    password: 'abc',
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

/**
 * Get the current user from the cookies included in a request.
 *
 * @param {object} req The request.
 * @param {object} users Information on all registered users.
 * @return {(object|null)} A user object if found, null otherwise.
 */
const getUserFromCookies = (req, users) =>
  req.cookies && req.cookies.user_id && req.cookies.user_id in users
    ? users[req.cookies.user_id]
    : null;

/**
 * Look for a user by email.
 * Assumes that there are no duplicate emails in the database.
 *
 * @param {string} email The email of the user.
 * @param {object} users Information on all registered users.
 * @return {(object|null)} A user object if found, null otherwise.
 */
const findUserFromEmail = (email, users) =>
  Object.values(users).filter((user) => user.email === email)[0] || null;

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

// GET / => Home page
app.get('/', (req, res) => {
  res.send('Hello!\n');
});

// GET /urls => Display list of all stored URLs
app.get('/urls', (req, res) => {
  console.log(users);
  const user = getUserFromCookies(req, users);
  const templateVars = { urls: urlDatabase, user };
  res.render('urls_index', templateVars);
});

// POST /urls/:id/delete => Delete URL from stored list
app.post('/urls/:id/delete', (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect('/urls');
});

// GET /urls/new => Page to create new URL
app.get('/urls/new', (req, res) => {
  const user = getUserFromCookies(req, users);
  res.render('urls_new', { user });
});

// POST /urls => Store new URL after creation
app.post('/urls', (req, res) => {
  const id = generateUniqueKey(6, urlDatabase);
  const validURL = validateURL(req.body.longURL);
  urlDatabase[id] = validURL;
  res.redirect(`/urls/${id}`);
});

// GET /urls/:id => Page to edit single URL
app.get('/urls/:id', (req, res) => {
  const id = req.params.id;
  const user = getUserFromCookies(req, users);
  const templateVars = { id, longURL: urlDatabase[id], user };
  res.render('urls_show', templateVars);
});

// POST /urls/:id => Update stored URL after editing
app.post('/urls/:id', (req, res) => {
  const id = req.params.id;
  const validURL = validateURL(req.body.longURL);
  urlDatabase[id] = validURL;
  res.redirect('/urls');
});

// GET /u/:id => Redirect short URL to long URL
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

// GET /register => Registration page
app.get('/register', (req, res) => {
  const user = getUserFromCookies(req, users);
  if (user) {
    return res.redirect('/urls'); // already logged in
  }
  res.render('register', { user });
});

// GET /login => Login page
app.get('/login', (req, res) => {
  const user = getUserFromCookies(req, users);
  if (user) {
    return res.redirect('/urls'); // already logged in
  }
  res.render('login', { user });
});

// POST /register => Register user (400 on failure)
app.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send(`Invalid registration input:<br />
      Email or password is empty`);
  }
  if (findUserFromEmail(email, users)) {
    return res.status(400).send(`Invalid registration input:<br />
      Email already registred`);
  }
  const id = generateUniqueKey(6, users);
  users[id] = { id, email, password };
  res.cookie('user_id', id);
  res.redirect('/urls');
});

// POST /login => Log user in (403 on failure)
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = findUserFromEmail(email, users);
  if (!user) {
    return res.status(403).send(`Invalid login input:<br />
      No registered user with that email`);
  }
  if (password !== user.password) {
    return res.status(403).send(`Invalid login input:<br />
      Incorrect password`);
  }
  res.cookie('user_id', user.id);
  res.redirect('/urls');
});

// POST /logout => Log user out
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

//------------------------------------------------------------------------------
// Start listening

app.listen(port, () => {
  console.log('------------------------------');
  console.log(`TinyApp listening on port ${port}`);
  console.log('------------------------------');
});
