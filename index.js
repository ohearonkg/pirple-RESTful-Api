/**
 * Primary file for the API
 */

// Dependancies
var http = require("http");

// Server should respond with a string
var server = http.createServer(function(req, res) {
  res.end("Hello World\n");
});

// Start the server, and have it run on port 3000
server.listen(3000, function() {
  console.log("The server is listening on port 3000");
});
