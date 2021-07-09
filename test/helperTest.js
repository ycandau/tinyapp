const { assert } = require('chai');

const {
  formatURL,
  getUserFromCookies,
  getUserByEmail,
} = require('../helpers.js');

//------------------------------------------------------------------------------

describe('#formatURL', () => {
  it('should return the url unchanged if the protocol is included', () => {
    const url = formatURL('http://www.example.com');
    const expectedUrl = 'http://www.example.com';
    assert.equal(url, expectedUrl);
  });

  it('should trim the url of extraneous whitespace', () => {
    const url = formatURL('   http://www.example.com    ');
    const expectedUrl = 'http://www.example.com';
    assert.equal(url, expectedUrl);
  });

  it('should add the protocol if it is missing', () => {
    const url = formatURL('www.example.com');
    const expectedUrl = 'http://www.example.com';
    assert.equal(url, expectedUrl);
  });
});

//------------------------------------------------------------------------------

describe('#getUserFromCookies', () => {
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

  it('should return undefined if the request is undefined', () => {
    const user = getUserFromCookies(undefined, users);
    assert.isUndefined(user);
  });

  it('should return undefined if request.session is undefined', () => {
    const user = getUserFromCookies({}, users);
    assert.isUndefined(user);
  });

  it('should return undefined if request.session.user_id is undefined', () => {
    const user = getUserFromCookies({ session: {} }, users);
    assert.isUndefined(user);
  });

  it('should return undefined if the user_id is unregistered', () => {
    const user = getUserFromCookies({ session: { user_id: 'xy' } }, users);
    assert.isUndefined(user);
  });

  it('should return the user if the user_id is valid', () => {
    const user = getUserFromCookies({ session: { user_id: 'u1' } }, users);
    const expectedUser = {
      id: 'u1',
      email: 'rfripp@example.com',
      password: 'thrak',
    };
    assert.deepEqual(user, expectedUser);
  });
});

//------------------------------------------------------------------------------

describe('#getUserByEmail', () => {
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

  it('should return a user with valid email', () => {
    const user = getUserByEmail('rfripp@example.com', users);
    const expectedUser = {
      id: 'u1',
      email: 'rfripp@example.com',
      password: 'thrak',
    };
    assert.deepEqual(user, expectedUser);
  });

  it('should return undefined for an unregistered email', () => {
    const user = getUserByEmail('alpha@example.com', users);
    assert.isUndefined(user);
  });

  it('should return undefined for an empty string', () => {
    const user = getUserByEmail('', users);
    assert.isUndefined(user);
  });

  it('should return undefined for undefined', () => {
    const user = getUserByEmail(undefined, users);
    assert.isUndefined(user);
  });

  it('should return undefined for null', () => {
    const user = getUserByEmail(null, users);
    assert.isUndefined(user);
  });
});
