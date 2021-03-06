/**
 * Primary file for the API
 */

// Dependancies
var http = require("http");
var https = require("https");
var url = require("url");
var StringDecoder = require("string_decoder").StringDecoder;
var config = require("./config");
var fs = require("fs");
var handlers = require("./lib/handlers");
var helpers = require("./lib/helpers");

// Remove This!
helpers.sendTwilioSms("4158375309", "ello", function(res) {
  console.log("Response Was: " + res);
});
// Create HTTP Server
var httpServer = http.createServer(function(req, res) {
  unifiedServer(req, res);
});

// Instantiation HTTP server
httpServer.listen(config.httpPort, function() {
  console.log("The HTTP server is listening on port ", config.httpPort);
});

// Creating the HTTPS Server
var httpsServerOptions = {
  key: fs.readFileSync("./https/key.pem"),
  cert: fs.readFileSync("./https/cert.pem")
};

var httpsServer = https.createServer(httpsServerOptions, function(req, res) {
  unifiedServer(req, res);
});

// Instantiation of HTTPS Server
httpsServer.listen(config.httpsPort, function() {
  console.log("The HTTPS server is listening on port ", config.httpsPort);
});

/**
 * The logic for both the HTTP and HTTPS
 * servers
 */
var unifiedServer = function(req, res) {
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
  var queryStringObject = parsedUrl.query;

  // Get the HTTP method force to case
  var method = req.method.toLocaleLowerCase();

  // Get the headers object
  var headers = req.headers;

  /**
   * Get the payload if any
   *
   * NOTE: The request object is
   * in the form of a stream. Hence
   * we must append incoming data
   * to our desired variable until
   * such time as we have the entirity
   * of the payload.
   */
  var decoder = new StringDecoder("utf-8");
  var buffer = "";
  req.on("data", function(data) {
    buffer += decoder.write(data);
  });

  /**
   * When we are done with the request
   * we perform our desired sending of
   * the response and logging actions
   */
  req.on("end", function() {
    buffer += decoder.end();

    /**
     * Choose the appropriate handler based on
     * the user's request.
     */
    var choosenHandler =
      typeof router[trimmedPath] !== "undefined"
        ? router[trimmedPath]
        : handlers.notFound;

    /**
     * Construct the data object to
     * be stringified and sent back
     * to the user
     */
    var data = {
      trimmedPath: trimmedPath,
      queryStringObject: queryStringObject,
      method: method,
      headers: headers,
      payload: helpers.parseJsonToObject(buffer)
    };

    /**
     * Route our request to the appropriate route handler
     */
    choosenHandler(data, function(statusCode, payload) {
      // Return either the status code or a default of 200
      statusCode = typeof statusCode == "number" ? statusCode : 200;

      // return either the payload of a default payload of an empty object
      payload = typeof payload == "object" ? payload : {};

      // Convert payload to string
      var payloadString = JSON.stringify(payload);

      // Return the response
      res.setHeader("Content-Type", "application/json");
      res.writeHead(statusCode);
      res.end(payloadString);

      // console.log("REQUEST");
      // console.log(data);
      // console.log();

      console.log("RESPONSE");
      console.log("Status Code ", statusCode);
      console.log(payloadString);
    });
  });
};

// Defining a request router
var router = {
  ping: handlers.ping,
  users: handlers.users,
  tokens: handlers.tokens,
  checks: handlers.checks
};
