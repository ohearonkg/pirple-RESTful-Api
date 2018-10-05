var crypto = require("crypto");
var config = require("../config");

var helpers = {};

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function(str) {
  try {
    var obj = JSON.parse(str);
    return obj;
  } catch (e) {
    return {};
  }
};

// Hash the user's password
helpers.hashPassword = function(password) {
  if (typeof password == "string" && password.length > 0) {
    var hash = crypto
      .createHmac("sha256", config.hashingSecret)
      .update(password)
      .digest("hex");
    return hash;
  } else {
    return false;
  }
};

/**
 *
 * This function shall be used
 * to check to ensure the desired
 * fields are present and if so
 * create the desired object for
 * updating a user

 * @param {Payload object with user data} data
 */
helpers.createUserObject = function(data) {
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
      hashedPassword: hashedPassword,
      tosAgreement: true
    };

    return userObject;
  }

  return false;
};

/**
 * Create alpha numberic string of characters
 * given a length
 */
helpers.createRandomString = function(length) {
  var stringLength = typeof length == "number" && length > 0 ? length : false;

  if (stringLength) {
    var possibleCharacters = "abcdefghijklmnopqrstuvwxyz0123456789";
    var str = "";
    for (i = 1; i <= length; i++) {
      var randomCharacter = possibleCharacters.charAt(
        Math.floor(Math.random() * possibleCharacters.length)
      );
      str += randomCharacter;
    }
    return str;
  } else {
    return false;
  }
};
module.exports = helpers;
