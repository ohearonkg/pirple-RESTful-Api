var crypto = require("crypto");
var config = require("../config");
var https = require("https");
var querystring = require("querystring");

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

/**
 * Send an SMS via twillo
 */
helpers.sendTwilioSms = function(phoneNumber, message, callback) {
  // Validate the parmeters
  var phone =
    typeof phoneNumber == "string" && phoneNumber.trim().length == 10
      ? phoneNumber.trim()
      : false;
  var message =
    typeof message == "string" &&
    message.trim().length > 0 &&
    message.trim().length <= 1600
      ? message
      : false;

  if (phone && message) {
    // Configure the request payload
    var payload = {
      From: config.twilio.fromPhone,
      To: "+1" + phone,
      Body: message
    };

    /**
     * Stringify the payload using
     * the querystring library as
     * twilio is NOT a json API
     */
    var stringPayload = querystring.stringify(payload);

    var requestDetails = {
      protocol: "https:",
      hostname: "api.twilio.com",
      method: "POST",
      path:
        "/2010-04-01/Accounts/" + config.twilio.accountSid + "/Messages.json",
      auth: config.twilio.accountSid + ":" + config.twilio.authToken,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(stringPayload)
      }
    };

    // Create request and send it off
    var request = https.request(requestDetails, function(res) {
      var status = res.statusCode;
      if (status == 200 || status == 201) {
        callback(false);
      } else {
        callback("Status code returned was " + status);
      }
    });

    // Prevent error from killing thread
    request.on("error", function(error) {
      callback(error);
    });

    // Add payload
    request.write(stringPayload);

    // End the request
    request.end();
  } else {
    callback("Missing on invalid parameters.");
  }
};
module.exports = helpers;
