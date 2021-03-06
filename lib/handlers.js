var _data = require("./data");
var helpers = require("./helpers");
var config = require("../config");
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
 * Required: Phone
 * Optional: firstName, lastName, password (at least one)
 */
handlers._users.PUT = function(data, callback) {
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
      // Ensure we have a valid token
      var token =
        typeof data.headers.token == "string" ? data.headers.token : false;

      if (token) {
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
            callback(400, {
              Error: "No User With Provided Phone Number Exists"
            });
          }
        });
      } else {
        callback(400, { Error: "Invalid Token" });
      }
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
 */
handlers._users.GET = function(data, callback) {
  // Check for a valid phone number
  var phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone.trim()
      : false;

  if (phone) {
    // Get the token from the headers
    var token =
      typeof data.headers.token == "string" ? data.headers.token : false;

    // Verify given token is valid for the phone number
    handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
      if (tokenIsValid) {
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
        callback(403, { Error: "Missing on invalid token" });
      }
    });
    // Attempt To Lookup The User
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
    // Ensure valid token
    var token =
      typeof data.headers.token == "string" &&
      data.headers.token.trim().length === 20
        ? data.headers.token
        : false;

    // Ensure User Who Created Check Is One Requesting
    handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
      if (tokenIsValid) {
        // Attempt To Lookup The User
        _data.read("Users", phone, function(error, data) {
          if (!error && data) {
            // Delete The User
            _data.delete("Users", phone, function(error) {
              if (!error) {
                // Delete the user's check
                var userChecks =
                  typeof data.checks == "object" && data.checks instanceof Array
                    ? data.checks
                    : [];
                var numChecksToDelete = userChecks.length;

                if (numChecksToDelete > 0) {
                  var checksDeleted = 0;
                  var checkDeleteError = false;
                  userChecks.forEach(function(checkId) {
                    _data.delete("Checks", checkId, function(error) {
                      if (error) {
                        checkDeleteError = true;
                      }
                      checksDeleted++;
                      if (numChecksToDelete === checksDeleted) {
                        if (!checkDeleteError) {
                          callback(200);
                        } else {
                          callback(500, {
                            Error:
                              "Error encounted removing checks form the user's object"
                          });
                        }
                      } else {
                        callback(500, {
                          Error: "error encouted deleting the user's checks"
                        });
                      }
                    });
                  });
                } else {
                  callback(200);
                }
              } else {
                callback(500, { Error: "Could Not Delete User." });
              }
            });
          } else {
            callback(400, { Error: "Could Not Find The Specified User" });
          }
        });
      } else {
        callback(400, { Error: "Invalid Token" });
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
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length === 10
      ? data.payload.phone.trim()
      : false;

  var password =
    typeof data.payload.password == "string"
      ? data.payload.password.trim()
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

/**
 * Getting the token for a user
 *
 * Required: id
 */
handlers._tokens.GET = function(data, callback) {
  // Check for valid id
  var id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  if (id) {
    // Attempt To Lookup The User
    _data.read("Tokens", id, function(error, data) {
      if (!error && data) {
        callback(200, data);
      } else {
        callback(404, { Error: "No Token With That ID Exists" });
      }
    });
  } else {
    callback(400, { Error: "Missing Required Fields." });
  }
};

/**
 * Extending the life of a token
 *
 * Require: ID, extend
 */
handlers._tokens.PUT = function(data, callback) {
  // Check for valid id
  var id =
    typeof data.payload.id == "string" && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;

  var extend =
    typeof data.payload.extend == "boolean" && data.payload.extend == true
      ? true
      : false;

  if (id && extend) {
    // Attempt To Lookup The User
    _data.read("Tokens", id, function(error, data) {
      if (!error && data) {
        // Ensure the token hasn't already expired
        if (data.expires > Date.now()) {
          data.expires = Date.now() + 1000 * 60 * 60;

          _data.update("Tokens", id, data, function(error) {
            if (!error) {
              callback(200);
            } else {
              callback(500, { Error: "Could not update the user's token" });
            }
          });
        } else {
          callback(400, {
            Error: "The Token Has Already Expired. Cannot Extend."
          });
        }
      } else {
        callback(404, { Error: "No Token With That ID Exists" });
      }
    });
  } else {
    callback(400, { Error: "Missing Required Fields." });
  }
};

/**
 * Deleting a token
 *
 * Required: id
 */
handlers._tokens.DELETE = function(data, callback) {
  var id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  if (id) {
    // Attempt To Lookup The Token
    _data.read("Tokens", id, function(error, data) {
      if (!error && data) {
        _data.delete("Tokens", id, function(error) {
          if (!error) {
            callback(200);
          } else {
            callback(500, { Error: "Could Not Delete Toek." });
          }
        });
      } else {
        callback(400, { Error: "Could Not Find The Specified Toek" });
      }
    });
  } else {
    callback(400, { Error: "Invalid Token. Must Be a 20 Digit String." });
  }
};

/**
 * Function to validate tokens for a particular user
 */
handlers._tokens.verifyToken = function(id, phone, callback) {
  _data.read("Tokens", id, function(error, data) {
    if (!error) {
      if (data.phone == phone && data.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

/**
 *
 * Handlers for dealing with checks
 */
handlers.checks = function(data, callback) {
  var allowedMethods = ["POST", "PUT", "GET", "DELETE"];

  if (allowedMethods.indexOf(data.method.toUpperCase()) !== -1) {
    handlers._checks[data.method.toUpperCase()](data, callback);
  } else {
    callback(405);
  }
};

handlers._checks = {};

/**
 * Required Data: protocol, url, method successCodes, timeoutSeconds
 */
handlers._checks.POST = function(data, callback) {
  // Validate our inputs
  var protocol =
    typeof data.payload.protocol == "string" &&
    ["http", "https"].indexOf(data.payload.protocol) !== -1
      ? data.payload.protocol
      : false;

  var url =
    typeof data.payload.url == "string" && data.payload.url.trim().length > 0
      ? data.payload.url
      : false;

  var method =
    typeof data.payload.method == "string" &&
    ["POST", "PUT", "GET", "DELETE"].indexOf(
      data.payload.method.toUpperCase()
    ) !== -1
      ? data.payload.method
      : false;

  var successCodes =
    typeof data.payload.successCodes == "object" &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;

  var timeoutSeconds =
    typeof data.payload.timeoutSeconds == "number" &&
    data.payload.timeoutSeconds % 1 === 0 &&
    data.payload.timeoutSeconds >= 1 &&
    data.payload.timeoutSeconds <= 5
      ? data.payload.timeoutSeconds
      : false;

  if (protocol && url && method && successCodes && timeoutSeconds) {
    // Check headers for token
    var token =
      typeof data.headers.token == "string" ? data.headers.token : false;

    // Lookup token
    _data.read("Tokens", token, function(error, tokenData) {
      if (!error && tokenData) {
        var userPhone = tokenData.phone;

        // Lookup User
        _data.read("Users", userPhone, function(error, userData) {
          if (!error && userData) {
            var userChecks =
              typeof userData.checks == "object" &&
              userData.checks instanceof Array
                ? userData.checks
                : [];

            // Ensure less than max checks
            if (userChecks.length < config.maxChecks) {
              var checkId = helpers.createRandomString(20);

              var checkObject = {
                ID: checkId,
                userPhone: userPhone,
                protocol: protocol,
                url: url,
                method: method,
                successCodes: successCodes,
                timeoutSeconds: timeoutSeconds
              };

              _data.create("Checks", checkId, checkObject, function(error) {
                if (!error) {
                  // Add the check id to the user's object
                  userData.checks = userChecks;
                  userData.checks.push(checkId);

                  _data.update("Users", userPhone, userData, function(error) {
                    if (!error) {
                      callback(200, checkObject);
                    } else {
                      callback(500, {
                        Error: "Could not update the user with the new check"
                      });
                    }
                  });
                } else {
                  callback(500, { Error: "Could not create new check" });
                }
              });
            } else {
              callback(400, {
                Error: "User already has maximum number of checks"
              });
            }
          } else {
            callback(403);
          }
        });
      } else {
        callback(403);
      }
    });
  } else {
    callback(400, { Error: "Invalid inputs." });
  }
};

/**
 * Required Data id
 */
handlers._checks.GET = function(data, callback) {
  // First validate the ID
  var id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length === 20
      ? data.queryStringObject.id
      : false;

  if (id) {
    // Lookup the check
    _data.read("Checks", id, function(error, checkData) {
      if (!error && checkData) {
        // Get the token from the headers
        var token =
          typeof data.headers.token == "string" &&
          data.headers.token.trim().length === 20
            ? data.headers.token
            : false;

        if (token) {
          // Verify Token is valid and belongs to the user who created the check
          handlers._tokens.verifyToken(token, checkData.userPhone, function(
            tokenIsValid
          ) {
            if (tokenIsValid) {
              /**
               * We have a valid check, the user phone associated
               * with that check is the same as the user phone on the
               * authentication token. Hence the user requesting this
               * resource is authenticated, and has created this check
               */
              callback(200, checkData);
            } else {
              callback(400, { Error: "Invalid Token" });
            }
          });
        } else {
          callback(400, { Error: "Missing Token" });
        }
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: "Check ID Does Not Meet Requirement" });
  }
};

/**
 * Requied Data: ID
 * Optional: protocol, url, method successCodes, timeoutSeconds
 */
handlers._checks.PUT = function(data, callback) {
  // First validate the ID
  var id =
    typeof data.payload.id == "string" && data.payload.id.trim().length === 20
      ? data.payload.id
      : false;

  if (id) {
    // Lookup our check
    _data.read("Checks", id, function(error, checkData) {
      if (!error && checkData) {
        // Get the token from the headers
        var token =
          typeof data.headers.token == "string" &&
          data.headers.token.trim().length === 20
            ? data.headers.token
            : false;

        // Ensure User Who Created Check Is One Requesting
        handlers._tokens.verifyToken(token, checkData.userPhone, function(
          tokenIsValid
        ) {
          if (tokenIsValid) {
            // Validate our inputs
            var protocol =
              typeof data.payload.protocol == "string" &&
              ["http", "https"].indexOf(data.payload.protocol) !== -1
                ? data.payload.protocol
                : false;

            var url =
              typeof data.payload.url == "string" &&
              data.payload.url.trim().length > 0
                ? data.payload.url
                : false;

            var method =
              typeof data.payload.method == "string" &&
              ["POST", "PUT", "GET", "DELETE"].indexOf(
                data.payload.method.toUpperCase()
              ) !== -1
                ? data.payload.method
                : false;

            var successCodes =
              typeof data.payload.successCodes == "object" &&
              data.payload.successCodes instanceof Array &&
              data.payload.successCodes.length > 0
                ? data.payload.successCodes
                : false;

            var timeoutSeconds =
              typeof data.payload.timeoutSeconds == "number" &&
              data.payload.timeoutSeconds % 1 === 0 &&
              data.payload.timeoutSeconds >= 1 &&
              data.payload.timeoutSeconds <= 5
                ? data.payload.timeoutSeconds
                : false;

            if (protocol || url || method || successCodes || timeoutSeconds) {
              // Update The Protocol
              if (protocol) {
                checkData.protocol = protocol;
              }
              if (url) {
                checkData.url = url;
              }
              if (method) {
                checkData.method = method;
              }
              if (successCodes) {
                checkData.successCodes = successCodes;
              }
              if (timeoutSeconds) {
                checkData.timeoutSeconds = timeoutSeconds;
              }

              _data.update("Checks", id, checkData, function(error) {
                if (!error) {
                  callback(200);
                } else {
                  callback(500, { Error: "Could not update check" });
                }
              });
            } else {
              callback(400, { Error: "Missing ONE of the optional fields" });
            }
          } else {
            callback(403);
          }
        });
      } else {
        callback(404, { Error: "Check With ID Provided Not Found" });
      }
    });
  } else {
    callback(400, { Error: "Invalid ID" });
  }
};

/**
 * Required Data: ID
 */
handlers._checks.DELETE = function(data, callback) {
  // First validate the ID
  var id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length === 20
      ? data.queryStringObject.id
      : false;

  if (id) {
    // Lookup Check with ID provided
    _data.read("Checks", id, function(error, checkData) {
      if (!error && checkData) {
        // Ensure valid token
        var token =
          typeof data.headers.token == "string" &&
          data.headers.token.trim().length === 20
            ? data.headers.token
            : false;

        // Ensure User Who Created Check Is One Requesting
        handlers._tokens.verifyToken(token, checkData.userPhone, function(
          tokenIsValid
        ) {
          if (tokenIsValid) {
            // Remove The Check File
            _data.delete("Checks", id, function(error) {
              if (!error) {
                _data.read("Users", checkData.userPhone, function(
                  error,
                  userData
                ) {
                  if (!error && userData) {
                    var userChecks =
                      typeof userData.checks == "object" &&
                      userData.checks instanceof Array
                        ? userData.checks
                        : [];

                    var checkPostion = userChecks.indexOf(id);
                    if (checkPostion !== -1) {
                      userChecks.splice(checkPostion, 1);

                      // Resave the user's data
                      _data.update(
                        "Users",
                        checkData.userPhone,
                        userData,
                        function(err) {
                          if (!err) {
                            callback(200);
                          } else {
                            callback(500, {
                              Error: "Could not remove check from user."
                            });
                          }
                        }
                      );
                    } else {
                      callback(400, {
                        Error:
                          "The provided check does not exist within the user's checks"
                      });
                    }
                  } else {
                    callback(400, {
                      Error:
                        "No user with the phone number who created this request exist"
                    });
                  }
                });
              } else {
                callback(500, { Error: "Could not remove check file." });
              }
            });
          } else {
            callback(403);
          }
        });
      } else {
        callback(400, { Error: "No check with id provided exist" });
      }
    });
  } else {
    callback(400, { Error: "Invalid Token" });
  }
};

module.exports = handlers;
