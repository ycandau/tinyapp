//==============================================================================
// helpers.js
//==============================================================================

/**
 * Generate a random alphanumeric character (digit, lowercase or uppercase).
 *
 * @return {string} The random character.
 */
const generateRandomChar = () => {
  const n = (Math.random() * 62) >> 0;
  const code =
    n < 26
      ? n + 65 // uppercase
      : n < 52
      ? n + 71 // lowercase
      : n < 62
      ? n - 4 // digits
      : 95; // default, never used
  return String.fromCharCode(code);
};

/**
 * Generate a string of random alphanumeric characters.
 *
 * @param {number} length The length of the string.
 * @return {string} The random string.
 */
const generateRandomString = (length) => {
  let str = '';
  for (let i = 0; i < length; i++) {
    str += generateRandomChar();
  }
  return str;
};

/**
 * Generate a unique alphanumeric key based on an existing collection.
 *
 * @param {number} length The length of the string.
 * @param {(set|array|object)} coll The collection of keys to not duplicate.
 * @return {string} A random string guaranteed to not be in the collection.
 */
const generateUniqueKey = (length, coll) => {
  // Setify arrays and objects, does not check for other types
  const set =
    coll instanceof Set
      ? coll
      : Array.isArray(coll)
      ? new Set(coll)
      : new Set(Object.keys(coll));

  let key = '';
  do {
    key = generateRandomString(length);
  } while (set.has(coll));
  return key;
};

/**
 * Cleans up an url and prepends http if no protocol is included.
 * Does not ensure that the url is an actual url.
 *
 * @param {string} url The input string for the url.
 * @return {string} A cleaned up url.
 */
const formatURL = (url) => {
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
  formatURL,
  getUserFromCookies,
  getUserByEmail,
  sendError,
};
