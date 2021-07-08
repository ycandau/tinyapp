//==============================================================================
// express_server.js
//==============================================================================

// @todo:
//   - Ask difference between: Unauthorized (401) | Forbidden (403)
//   - Link for new URL in urls_list
//   - Check about session cookie deletion

//------------------------------------------------------------------------------
// Password encryption

const bcrypt = require('bcrypt');

//------------------------------------------------------------------------------
// Constants and simulated databases

const port = 8080;

const urlDatabase = {
  l1: {
    shortURL: 'l1',
    longURL: 'http://www.example.com',
    userID: 'u1',
  },
  l2: {
    shortURL: 'l2',
    longURL: 'http://www.google.com',
    userID: 'u1',
  },
  l3: {
    shortURL: 'l3',
    longURL: 'http://www.lighthouselabs.ca',
    userID: 'u1',
  },
  la1: {
    shortURL: 'la1',
    longURL: 'http://www.example.com',
    userID: 'ua',
  },
  la2: {
    shortURL: 'la2',
    longURL: 'http://www.laaa2.ca',
    userID: 'ua',
  },
  lb1: {
    shortURL: 'lb1',
    longURL: 'http://www.example.com',
    userID: 'ub',
  },
  lb2: {
    shortURL: 'lb2',
    longURL: 'http://www.lbbb2.ca',
    userID: 'ub',
  },
};

const users = {
  u1: {
    id: 'u1',
    email: 'rfripp@example.com',
    password: bcrypt.hashSync('thrak', 10),
  },
  u2: {
    id: 'u2',
    email: 'sreich@example.com',
    password: bcrypt.hashSync('18musicians', 10),
  },
  ua: {
    id: 'ua',
    email: 'a@a',
    password: bcrypt.hashSync('aaa', 10),
  },
  ub: {
    id: 'ub',
    email: 'b@b',
    password: bcrypt.hashSync('bbb', 10),
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
  const trimmed = url.trim();
  return trimmed.includes('http') ? trimmed : `http://${trimmed}`;
};

/**
 * Get the current user from the cookies included in a request.
 *
 * @param {object} req The request.
 * @param {object} users Information on all registered users.
 * @return {(object|null)} A user object if found, or `null` otherwise.
 */
const getUserFromCookies = (req, users) =>
  req.session && req.session.user_id && req.session.user_id in users
    ? users[req.session.user_id]
    : null;

/**
 * Look for a user by email.
 * Assumes that there are no duplicate emails in the database.
 *
 * @param {string} email The email of the user.
 * @param {object} users Users database.
 * @return {(object|null)} A user object if found, or `null` otherwise.
 */
const findUserFromEmail = (email, users) =>
  Object.values(users).filter((user) => user.email === email)[0] || null;

/**
 * Filter the database to get the array of URL objects owned by a user.
 *
 * @param {string} id User id.
 * @param {object} urlDatabase URL database.
 * @returns {array} An array of all URL objects with matching user ids.
 */
const urlsForUser = (id, urlDatabase) =>
  Object.values(urlDatabase).filter(({ userID }) => userID === id);

/**
 * Send an error message in return to an invalid request.
 *
 * @param {number} code The status code to send back.
 * @param {string} msg A message describing the issue.
 * @param {object} req The request.
 * @param {object} res The response.
 */
const error = (code, msg) => (req, res) =>
  res.status(code).send(`
  Invalid request: <br />
  Method: ${req.method} <br />
  Action: ${req.originalUrl} <br />
  Status: ${code} <br />
  Cause:  ${msg} <br />\n\n`);

//------------------------------------------------------------------------------
// Error messages

const emptyRegistrationInput = error(400, 'Email or password is empty');
const emailAlreadyRegistered = error(400, 'Email already registred');

const userNotLoggedIn = error(403, 'User not logged in');
const userDoesNotOwn = error(403, 'User does not own URL');
const emailNoteRegistered = error(403, 'Email not registered');
const incorrectPassword = error(403, 'Incorrect password');

const urlDoesNotExist = error(404, 'Short URL does not exist');

//------------------------------------------------------------------------------
// Create and initialize server

const express = require('express');
const app = express();
app.set('view engine', 'ejs');

//------------------------------------------------------------------------------
// Use middleware

const morgan = require('morgan');
app.use(morgan('dev'));

var cookieSession = require('cookie-session');
app.use(
  cookieSession({
    name: 'session',
    keys: ['phenomene', 'ectoplasme', 'sempiternel'],
  })
);

app.use(express.urlencoded({ extended: false })); // primitives only

//------------------------------------------------------------------------------
// GET / => Home page

app.get('/', (req, res) => {
  const user = getUserFromCookies(req, users);
  if (!user) return res.redirect('/login');
  res.redirect('/urls');
});

//------------------------------------------------------------------------------
// GET /urls => Display list of all stored URLs
// @todo | Stretch: date / number of visits / unique visits

app.get('/urls', (req, res) => {
  const user = getUserFromCookies(req, users);
  if (!user) return userNotLoggedIn(req, res);

  // Happy
  const urls = urlsForUser(user.id, urlDatabase);
  res.render('urls_list', { urls, user });
});

//------------------------------------------------------------------------------
// GET /urls/new => Page to create new URL

app.get('/urls/new', (req, res) => {
  const user = getUserFromCookies(req, users);
  if (!user) return res.redirect('/login');

  // Happy
  res.render('urls_new', { user });
});

//------------------------------------------------------------------------------
// GET /urls/:shortURL => Page to edit single URL
// @todo | Stretch: Analytics

app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const urlExists = shortURL in urlDatabase;
  if (!urlExists) return urlDoesNotExist(req, res);

  const user = getUserFromCookies(req, users);
  if (!user) return userNotLoggedIn(req, res);

  const userOwns = urlDatabase[shortURL].userID === user.id;
  if (!userOwns) return userDoesNotOwn(req, res);

  // Happy
  const longURL = urlDatabase[shortURL].longURL;
  res.render('urls_edit', { shortURL, longURL, user });
});

//------------------------------------------------------------------------------
// GET /u/:shortURL => Redirect short URL to long URL

app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const urlExists = shortURL in urlDatabase;
  if (!urlExists) return urlDoesNotExist(req, res);

  // Happy
  res.redirect(urlDatabase[shortURL].longURL);
});

//------------------------------------------------------------------------------
// POST /urls => Store new URL after creation

app.post('/urls', (req, res) => {
  const user = getUserFromCookies(req, users);
  if (!user) return userNotLoggedIn(req, res);

  // Happy
  const shortURL = generateUniqueKey(6, urlDatabase);
  const longURL = validateURL(req.body.longURL);
  urlDatabase[shortURL] = { shortURL, longURL, userID: user.id };
  res.redirect(`/urls/${shortURL}`);
});

//------------------------------------------------------------------------------
// POST /urls/:shortURL => Update stored URL after editing

app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const urlExists = shortURL in urlDatabase;
  if (!urlExists) return urlDoesNotExist(req, res);

  const user = getUserFromCookies(req, users);
  if (!user) return userNotLoggedIn(req, res);

  const userOwns = urlDatabase[shortURL].userID === user.id;
  if (!userOwns) return userDoesNotOwn(req, res);

  // Happy
  const longURL = validateURL(req.body.longURL);
  urlDatabase[shortURL].longURL = longURL;
  res.redirect('/urls');
});

//------------------------------------------------------------------------------
// POST /urls/:shortURL/delete => Delete URL from stored list

app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  const urlExists = shortURL in urlDatabase;
  if (!urlExists) return urlDoesNotExist(req, res);

  const user = getUserFromCookies(req, users);
  if (!user) return userNotLoggedIn(req, res);

  const userOwns = urlDatabase[shortURL].userID === user.id;
  if (!userOwns) return userDoesNotOwn(req, res);

  // Happy
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

//------------------------------------------------------------------------------
// GET /login => Login page

app.get('/login', (req, res) => {
  const user = getUserFromCookies(req, users);
  if (user) return res.redirect('/urls');
  res.render('login', { user });
});

//------------------------------------------------------------------------------
// GET /register => Registration page

app.get('/register', (req, res) => {
  const user = getUserFromCookies(req, users);
  if (user) return res.redirect('/urls');
  res.render('register', { user });
});

//------------------------------------------------------------------------------
// POST /login => Log user in (403 on failure)

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = findUserFromEmail(email, users);
  if (!user) return emailNoteRegistered(req, res);
  if (!bcrypt.compareSync(password, user.password)) {
    return incorrectPassword(req, res);
  }

  // Happy
  req.session.user_id = user.id;
  res.redirect('/urls');
});

//------------------------------------------------------------------------------
// POST /register => Register user (400 on failure)

app.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return emptyRegistrationInput(req, res);
  if (findUserFromEmail(email, users)) return emailAlreadyRegistered(req, res);

  // Happy
  const id = generateUniqueKey(6, users);
  const hashedPassword = bcrypt.hashSync(password, 10);
  users[id] = { id, email, password: hashedPassword };
  req.session.user_id = id;
  res.redirect('/urls');
});

//------------------------------------------------------------------------------
// POST /logout => Log user out

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/');
});

//------------------------------------------------------------------------------
// Start listening

app.listen(port, () => {
  console.log('------------------------------');
  console.log(`TinyApp listening on port ${port}`);
  console.log('------------------------------');
});
