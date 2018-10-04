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
  envName: "STAGING"
};

/**
 * Production
 */
enviornments.production = {
  httpPort: 5000,
  httpsPort: 5001,
  envName: "PRODUCTION"
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
