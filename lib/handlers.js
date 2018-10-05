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

  var phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length > 0
      ? data.payload.phone.trim()
      : false;

  var password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  var tosAgreement =
    typeof data.payload.tosAgreement == "boolean" &&
    data.payload.tosAgreement == true
      ? true
      : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    /**
     * Attempt to read the user's file to determine
     * if the user exists
     */
    _data.read("Users", phone, function(error, data) {
      /**
       * And Error attempting to read the file should
       * indicate that the file does not exist, and hence
       * we shall need to create it
       */
      if (error) {
        var hashedPassword = helpers.hashPassword(password);
        var userObject = {
          firstName: firstName,
          lastName: lastName,
          phone: phone,
          password: hashedPassword,
          tosAgreement: true
        };

        _data.create("Users", phone, userObject, function(error) {
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
 */
handlers._users.PUT = function(data, callback) {
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

  var phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length > 0
      ? data.payload.phone.trim()
      : false;

  var password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  var tosAgreement =
    typeof data.payload.tosAgreement == "boolean" &&
    data.payload.tosAgreement == true
      ? true
      : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    var hashedPassword = helpers.hashPassword(password);
    var userObject = {
      firstName: firstName,
      lastName: lastName,
      phone: phone,
      password: hashedPassword,
      tosAgreement: true
    };

    // Look to see if the user exists
    _data.read("Users", phone, function(error, data) {
      /**
       * We will recieve and error should a file
       * with the user's phone number not exist.
       */
      if (!error) {
        _data.update("Users", phone, userObject, function(error) {
          if (!error) {
            callback(200);
          } else {
            callback(400, {
              Error: "User With Phone Number" + phone + "Could Not Be Updated"
            });
          }
        });
      } else {
        callback(400, { Error: "Error Attempting to Read The File" });
      }
    });
  } else {
    callback(400, { Error: "Not all agruments provided for upate" });
  }

  // If the usere DNE return 400

  // User does exist take payload
  // call update function
};
module.exports = handlers;
