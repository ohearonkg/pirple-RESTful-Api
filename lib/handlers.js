var _data = require("./data");

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
    _data.read("Users", "Users", function(error, data) {
      /**
       * And Error attempting to read the file should
       * indicate that the file does not exist, and hence
       * we shall need to create it
       */
      if (error) {
        _data.create(
          "Users",
          "Users",
          {
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            password: password
          },
          callback
        );
      } else {
        console.log("Read the file");
      }
    });
  } else {
    callback(400, { Error: "Missing Required Fields" });
  }
};

//   /**
//    * Updating A User
//    */
//   PUT: function(data, callback) {
//     lib.update("Users", "Users", data, callback);
//   },

//   /**
//    * Getting A User
//    */
//   GET: function(data, callback) {
//     lib.read("Users", "Users", data, callback);
//   },

//   /**
//    * Deleting A User
//    */
//   DELETE: function(data, callback) {
//     lib.delete("Users", "Users", callback);
//   }
// };

module.exports = handlers;
