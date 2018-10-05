var _data = require("./data");
var helpers = require("./helpers");

/**
 * This file defines how each request
 * to a particular route is handled
 */
var handlers = {};

// Ping Handler
handlers.ping = function(data, callback) {
  callback(200);
};

// Not Found
handlers.notFound = function(data, callback) {
  callback(404);
};

handlers.users = function(data, callback) {
  var allowedMethods = ["POST", "PUT", "GET", "DELETE"];

  if (allowedMethods.indexOf(data.method.toUpperCase()) !== -1) {
    handlers._users[data.method.toUpperCase()](data, callback);
  } else {
    callback(405);
  }
};

handlers._users = {};

/**
 * Adding a user
 */
handlers._users.POST = function(data, callback) {
  var userObject = helpers.createUserObject(data);

  if (userObject) {
    /**
     * Attempt to read the user's file to determine
     * if the user exists
     */
    _data.read("Users", userObject.phone, function(error, data) {
      /**
       * And Error attempting to read the file should
       * indicate that the file does not exist, and hence
       * we shall need to create it
       */
      if (error) {
        _data.create("Users", userObject.phone, userObject, function(error) {
          if (!error) {
            console.log("USER CREATED");
            callback(200);
          } else {
            console.log("COULD NOT CREATE THE NEW USER");
            callback(500);
          }
        });
      } else {
        callback(400, { Error: "User with that phone number already exists!" });
      }
    });
  } else {
    callback(400, { Error: "Missing Required Fields" });
  }
};

/**
 * Handling Update A User
 *
 * @todo Only allow authenicated users to update their data
 *
 * Required: Phone
 * Optional: firstName, lastName, password (at least one)
 */
handlers._users.PUT = function(data, callback) {
  console.log(data);
  var phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;

  var firstName =
    typeof data.payload.firstName == "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;

  var lastName =
    typeof data.payload.lastName == "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;

  var password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  if (phone) {
    if (firstName || lastName || password) {
      _data.read("Users", phone, function(error, data) {
        if (!error && data) {
          if (firstName) {
            data.firstName = firstName;
          }
          if (lastName) {
            data.lastName = lastName;
          }
          if (password) {
            data.hashedPassword = helpers.hashPassword(password);
          }

          _data.update("Users", phone, data, function(error) {
            if (!error) {
              callback(200);
            } else {
              callback(500, { Error: "Could not update user file" });
            }
          });
        } else {
          callback(400, { Error: "No User With Provided Phone Number Exists" });
        }
      });
    } else {
      callback(400, {
        Error: "Must Provide One or More Of FirstName, LastName, Password."
      });
    }
  } else {
    callback(400, { Error: "Invalid Phone Number. Must Be 10 Digits" });
  }
};

/**
 * Handling getting a user
 *
 * @todo Only allow authenticated users to access their object
 */
handlers._users.GET = function(data, callback) {
  // Check for a valid phone number
  var phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone.trim()
      : false;

  if (phone) {
    // Attempt To Lookup The User
    _data.read("Users", phone, function(error, data) {
      if (!error && data) {
        // Remove the hashed password from the user
        // object before returning it
        delete data.hashedPassword;
        callback(200, data);
      } else {
        callback(404, { Error: "No User With That Phone Number Exists" });
      }
    });
  } else {
    callback(400, { Error: "Invalid Phone Number. Must Be 10 Digits." });
  }
};

/**
 * Handling Deleting a user
 *
 * @todo Only allow authenticated user to allow their object
 * @todo Clean up other files related to user
 */
handlers._users.DELETE = function(data, callback) {
  var phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone.trim()
      : false;

  if (phone) {
    // Attempt To Lookup The User
    _data.read("Users", phone, function(error, data) {
      if (!error && data) {
        _data.delete("Users", phone, function(error) {
          if (!error) {
            callback(200);
          } else {
            callback(500, { Error: "Could Not Delete User." });
          }
        });
      } else {
        callback(400, { Error: "Could Not Find The Specified User" });
      }
    });
  } else {
    callback(400, { Error: "Invalid Phone Number. Must Be 10 Digits." });
  }
};

/**
 *
 * Handlers for dealing with tokens
 */
handlers.tokens = function(data, callback) {
  var allowedMethods = ["POST", "PUT", "GET", "DELETE"];

  if (allowedMethods.indexOf(data.method.toUpperCase()) !== -1) {
    handlers._tokens[data.method.toUpperCase()](data, callback);
  } else {
    callback(405);
  }
};

handlers._tokens = {};
/**
 * Function to create a token for a user
 *
 * Required: Phone, Password
 */
handlers._tokens.POST = function(data, callback) {
  var phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone.trim()
      : false;

  var password =
    typeof data.queryStringObject.password == "string"
      ? data.queryStringObject.password.trim()
      : false;

  if (phone && password) {
    _data.read("Users", phone, function(error, data) {
      if (!error) {
        var hashedPassword = helpers.hashPassword(password);

        if (hashedPassword == data.hashedPassword) {
          var tokenId = helpers.createRandomString(20);
          var expires = Date.now() + 1000 * 60 * 60;
          var tokenObject = {
            phone: phone,
            id: tokenId,
            expires: expires
          };
          _data.create("Tokens", tokenId, tokenObject, function(error) {
            if (!error) {
              callback(200, tokenObject);
            } else {
              callback(500, { Error: "Could Not Create New Token" });
            }
          });
        } else {
          callback(400, { Error: "Passwords Did Not Match" });
        }
      } else {
        callback(404, {
          Error: "No user with the specified phone number could be found"
        });
      }
    });
  } else {
    callback(400, { Error: "Must Provide Both Phone Number and Password" });
  }
};

module.exports = handlers;
