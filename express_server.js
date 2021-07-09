//==============================================================================
// express_server.js
//==============================================================================

//------------------------------------------------------------------------------
// Misc requires

const bcrypt = require('bcryptjs');
const users = require('./data/users'); // pseudo database
const urlDatabase = require('./data/urls'); // pseudo database

const {
  generateUniqueKey,
  formatURL,
  getUserFromCookies,
  getUserByEmail,
  sendError,
} = require('./helpers');

//------------------------------------------------------------------------------
// Constants and globals

const port = 8080;

const allVisitors = new Set();

//------------------------------------------------------------------------------
// Error codes and messages

// Bad request (400)
const emptyRegistrationInput = sendError(400, 'Email or password is empty');
const emailAlreadyRegistered = sendError(400, 'Email is already registered');

// Unauthorized (401)
const emailNotRegistered = sendError(401, 'Email is not registered');
const incorrectPassword = sendError(401, 'Incorrect password');
const userNotLoggedIn = sendError(401, 'User not logged in');

// Forbidden (403)
const userDoesNotOwn = sendError(403, 'User does not own short URL');

// Not found (404)
const urlDoesNotExist = sendError(404, 'Short URL does not exist');

// Method not allowed (405)
const usePut = sendError(405, 'Method overridden: Use PUT /urls/:id');
const useDelete = sendError(405, 'Method overridden: Use DELETE /urls/:id');

//------------------------------------------------------------------------------
// Create and initialize server

const express = require('express');
const app = express();
app.set('view engine', 'ejs');

//------------------------------------------------------------------------------
// Use middleware

const morgan = require('morgan');
app.use(morgan('dev'));

const cookieSession = require('cookie-session');
app.use(cookieSession({ name: 'session', keys: ['noema', 'noesis', 'sator'] }));

app.use((req, res, next) => {
  if (req.query._method) req.method = req.query._method;
  next();
});

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

app.get('/urls', (req, res) => {
  const user = getUserFromCookies(req, users);
  if (!user) return userNotLoggedIn(req, res);

  // Happy
  const urls = Object.values(urlDatabase).filter(
    ({ userID }) => userID === user.id
  );
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

app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const urlExists = shortURL in urlDatabase;
  if (!urlExists) return urlDoesNotExist(req, res);

  const user = getUserFromCookies(req, users);
  if (!user) return userNotLoggedIn(req, res);

  const url = urlDatabase[shortURL];
  const userOwns = url.userID === user.id;
  if (!userOwns) return userDoesNotOwn(req, res);

  // Happy
  res.render('urls_edit', { user, url });
});

//------------------------------------------------------------------------------
// GET /u/:shortURL => Redirect short URL to long URL

app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const urlExists = shortURL in urlDatabase;
  if (!urlExists) return urlDoesNotExist(req, res);

  // Happy
  const url = urlDatabase[shortURL];

  // Analytics
  // Get fresh id if no visitor cookie or old cookie
  const visitor_id =
    !req.session.visitor_id || !allVisitors.has(req.session.visitor_id)
      ? generateUniqueKey(6, allVisitors)
      : req.session.visitor_id;

  // Ok to do even if not necessary (idempotent)
  allVisitors.add(visitor_id);
  url.visitors.add(visitor_id);
  req.session.visitor_id = visitor_id;
  url.logs.push({ id: visitor_id, date: new Date() });

  res.redirect(url.longURL);
});

//------------------------------------------------------------------------------
// POST /urls => Create new URL

app.post('/urls', (req, res) => {
  const user = getUserFromCookies(req, users);
  if (!user) return userNotLoggedIn(req, res);

  // Happy
  const shortURL = generateUniqueKey(6, urlDatabase);
  urlDatabase[shortURL] = {
    shortURL,
    longURL: formatURL(req.body.longURL),
    userID: user.id,
    dateCreated: new Date(),
    visitors: new Set(),
    logs: [],
  };
  res.redirect(`/urls/${shortURL}`);
});

//------------------------------------------------------------------------------
// POST /urls/:shortURL?_method=PUT
// => PUT /urls/:shortURL => Replace / Update URL

app.post('/urls/:shortURL', usePut); // Method overridden

app.put('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const urlExists = shortURL in urlDatabase;
  if (!urlExists) return urlDoesNotExist(req, res);

  const user = getUserFromCookies(req, users);
  if (!user) return userNotLoggedIn(req, res);

  const userOwns = urlDatabase[shortURL].userID === user.id;
  if (!userOwns) return userDoesNotOwn(req, res);

  // Happy
  const longURL = formatURL(req.body.longURL);
  urlDatabase[shortURL].longURL = longURL;
  res.redirect('/urls');
});

//------------------------------------------------------------------------------
// POST /urls/:shortURL?_method=DELETE
// => DELETE /urls/:shortURL => Delete URL

app.post('/urls/:shortURL/delete', useDelete); // Method overridden

app.delete('/urls/:shortURL', (req, res) => {
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
// POST /login => Log user in

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);
  if (!user) return emailNotRegistered(req, res);

  bcrypt
    .compare(password, user.password)
    .then((doesMatch) => {
      if (!doesMatch) return incorrectPassword(req, res);

      // Happy
      req.session.user_id = user.id;
      res.redirect('/urls');
    })
    .catch((err) => console.error(err));
});

//------------------------------------------------------------------------------
// POST /register => Register user

app.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return emptyRegistrationInput(req, res);
  if (getUserByEmail(email, users)) return emailAlreadyRegistered(req, res);

  // Happy
  bcrypt
    .genSalt(10)
    .then((salt) => bcrypt.hash(password, salt))
    .then((hashedPassword) => {
      const id = generateUniqueKey(6, users);
      users[id] = { id, email, password: hashedPassword };
      req.session.user_id = id;
      res.redirect('/urls');
    })
    .catch((err) => console.error(err));
});

//------------------------------------------------------------------------------
// POST /logout => Log user out

app.post('/logout', (req, res) => {
  if (!req.session.visitor_id) {
    // Delete whole session if no visitor cookie
    req.session = null;
  } else {
    // But keep visitor cookie if present
    delete req.session.user_id;
  }
  res.redirect('/urls');
});

// Note: The redirect to /urls on logout implements the Behaviour Requirements
//       from Compass, but leads to an error...

//------------------------------------------------------------------------------
// Start listening

app.listen(port, () => {
  console.log(`
------------------------------
TinyApp listening on port ${port}
------------------------------`);
});
