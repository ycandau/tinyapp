//==============================================================================
// users.js
//==============================================================================

const bcrypt = require('bcrypt');

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

module.exports = users;
