//==============================================================================
// express_server.js
//==============================================================================

// @todo:
//   - Ask difference between: Unauthorized (401) | Forbidden (403)
//   - Link for new URL in urls_list
//   - Check about session cookie deletion

//------------------------------------------------------------------------------
// Constants

const port = 8080;

//------------------------------------------------------------------------------
// Misc requires

const bcrypt = require('bcrypt');

const users = require('./data/users');
const urlDatabase = require('./data/urls');

const {
  generateUniqueKey,
  validateURL,
  getUserFromCookies,
  getUserByEmail,
  urlsForUser,
  sendError,
} = require('./helpers');

//------------------------------------------------------------------------------
// Error messages

const emptyRegistrationInput = sendError(400, 'Email or password is empty');
const emailAlreadyRegistered = sendError(400, 'Email already registred');

const userNotLoggedIn = sendError(403, 'User not logged in');
const userDoesNotOwn = sendError(403, 'User does not own URL');
const emailNoteRegistered = sendError(403, 'Email not registered');
const incorrectPassword = sendError(403, 'Incorrect password');

const urlDoesNotExist = sendError(404, 'Short URL does not exist');

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
  const user = getUserByEmail(email, users);
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
  if (getUserByEmail(email, users)) return emailAlreadyRegistered(req, res);

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
