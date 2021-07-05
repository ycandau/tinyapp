//==============================================================================
// express_server.js

//------------------------------------------------------------------------------
// Require modules

const express = require("express");

//------------------------------------------------------------------------------
// Set constants

const PORT = 8080;

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

//------------------------------------------------------------------------------
// Create and initialize server

const app = express();
app.set("view engine", "ejs");

//------------------------------------------------------------------------------
// Set endpoints

app.get("/", (req, res) => {
  res.send("Hello!\n");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//------------------------------------------------------------------------------
// Start listening

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
