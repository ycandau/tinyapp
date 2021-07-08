//==============================================================================
// helpers.js
//==============================================================================

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
 * @return {(object|undefined)} A user object if found, `undefined` otherwise.
 */
const getUserFromCookies = (req, users) =>
  req && req.session && req.session.user_id && req.session.user_id in users
    ? users[req.session.user_id]
    : undefined;

/**
 * Look for a user by email.
 * Assumes that there are no duplicate emails in the database.
 *
 * @param {string} email The email of the user.
 * @param {object} users Users database.
 * @return {(object|undefined)} A user object if found, `undefined` otherwise.
 */
const getUserByEmail = (email, users) =>
  Object.values(users).filter((user) => user.email === email)[0] || undefined;

/**
 * Send an error message in return to an invalid request.
 *
 * @param {number} code The status code to send back.
 * @param {string} msg A message describing the issue.
 * @param {object} req The request.
 * @param {object} res The response.
 */
const sendError = (code, msg) => (req, res) =>
  res.status(code).send(`
  Invalid request: <br />
  Method: ${req.method} <br />
  Action: ${req.originalUrl} <br />
  Status: ${code} <br />
  Cause:  ${msg} <br />\n\n`);

module.exports = {
  generateUniqueKey,
  validateURL,
  getUserFromCookies,
  getUserByEmail,
  sendError,
};
