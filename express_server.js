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
// Create server

const app = express();

//------------------------------------------------------------------------------
// Set endpoints

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//------------------------------------------------------------------------------
// Start listening

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
