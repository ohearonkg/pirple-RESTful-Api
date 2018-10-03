/**
 * Primary file for the API
 */

// Dependancies
var http = require("http");
var url = require("url");

// Server should respond with a string
var server = http.createServer(function(req, res) {
  /**
   * Get the url requested and parse it.
   *
   * NOTE: setting true to the second argument
   * here allows the url library to make use
   * of the querystring module to parse the
   * query string.
   */
  var parsedUrl = url.parse(req.url, true);

  // Get the path from the above parsed url
  var path = parsedUrl.pathname;

  // Remove leading and trailing slash
  var trimmedPath = path.replace(/^\/+|\/+$/g, "");

  // Get the query string as an object
  var queryString = parsedUrl.query;

  // Get the HTTP method force to case
  var method = req.method.toLocaleLowerCase();

  // Get the headers object
  var headers = req.headers;

  // Send the response
  res.end("Hello World!");

  // Log the path requested
  console.log("Path Requested: ", trimmedPath);
  console.log("Method: ", method);
  console.log("Query String: ", queryString);
  console.log("Headers: ", headers, "\n");
});

// Start the server, and have it run on port 3000
server.listen(3000, function() {
  console.log("The server is listening on port 3000");
});
