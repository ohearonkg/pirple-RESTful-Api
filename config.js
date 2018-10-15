/**
 * Creating and exporting the configuration
 * variables
 */

var enviornments = {};

/**
 * Staging
 */
enviornments.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: "STAGING",
  hashingSecret: "secret",
  maxChecks: 5,
  twilio: {
    accountSid: "ACb32d411ad7fe886aac54c665d25e5c5d",
    authToken: "9455e3eb3109edc12e3d8c92768f7a67",
    fromPhone: "+15005550006"
  }
};

/**
 * Production
 */
enviornments.production = {
  httpPort: 5000,
  httpsPort: 5001,
  envName: "PRODUCTION",
  hashingSecret: "secret",
  maxChecks: 5,
  twilio: {
    accountSid: "ACb32d411ad7fe886aac54c665d25e5c5d",
    authToken: "9455e3eb3109edc12e3d8c92768f7a67",
    fromPhone: "+15005550006"
  }
};

/**
 * Determine which enviornment has been passed
 * as a command line variable
 */
var currentEnviornment =
  typeof process.env.NODE_ENV == "string"
    ? process.env.NODE_ENV.toLowerCase()
    : "";

/**
 * Check if the current enviornment is
 * one of the predefined and if not default
 * to staging
 */
var enviornmentToExport =
  typeof enviornments[currentEnviornment] == "object"
    ? enviornments[currentEnviornment]
    : enviornments.staging;

module.exports = enviornmentToExport;
