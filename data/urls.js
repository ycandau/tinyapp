//==============================================================================
// urls.js
//==============================================================================

const urlDatabase = {
  l1: {
    shortURL: 'l1',
    longURL: 'http://www.example.com',
    userID: 'u1',
    dateCreated: new Date(2020, 2, 3),
    visitCount: 3,
    uniqueVisitCount: 1,
  },
  l2: {
    shortURL: 'l2',
    longURL: 'http://www.google.com',
    userID: 'u1',
    dateCreated: new Date(2020, 2, 3),
    visitCount: 29,
    uniqueVisitCount: 8,
  },
  l3: {
    shortURL: 'l3',
    longURL: 'http://www.lighthouselabs.ca',
    userID: 'u1',
    dateCreated: new Date(2020, 2, 3),
    visitCount: 8,
    uniqueVisitCount: 5,
  },
  la1: {
    shortURL: 'la1',
    longURL: 'http://www.example.com',
    userID: 'ua',
    dateCreated: new Date(2020, 2, 3),
    visitCount: 2,
    uniqueVisitCount: 2,
  },
  la2: {
    shortURL: 'la2',
    longURL: 'http://www.laaa2.ca',
    userID: 'ua',
    dateCreated: new Date(2020, 2, 3),
    visitCount: 7,
    uniqueVisitCount: 4,
  },
  lb1: {
    shortURL: 'lb1',
    longURL: 'http://www.example.com',
    userID: 'ub',
    dateCreated: new Date(2020, 2, 3),
    visitCount: 0,
    uniqueVisitCount: 0,
  },
  lb2: {
    shortURL: 'lb2',
    longURL: 'http://www.lbbb2.ca',
    userID: 'ub',
    dateCreated: new Date(2020, 2, 3),
    visitCount: 12,
    uniqueVisitCount: 5,
  },
};

module.exports = urlDatabase;
