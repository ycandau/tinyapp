//==============================================================================
// users.js
//==============================================================================

const bcrypt = require('bcryptjs');

const users = {
  rfripp: {
    id: 'rfripp',
    email: 'rfripp@example.com',
    password: bcrypt.hashSync('red', 10),
  },
  sreich: {
    id: 'sreich',
    email: 'sreich@example.com',
    password: bcrypt.hashSync('18m', 10),
  },
  aaaaaa: {
    id: 'aaaaaa',
    email: 'a@a',
    password: bcrypt.hashSync('aaa', 10),
  },
};

module.exports = users;
