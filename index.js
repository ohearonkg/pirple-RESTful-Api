/**
 * Primary File for API
 */
var server = require("./lib/server");

// Declare our application
var app = {};

// Init
app.init = function() {
  // Start our server
  server.init();
};

app.init();

module.exports = app;
