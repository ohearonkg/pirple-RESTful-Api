/**
 * Worker related tasks
 */
var path = require("path");
var fs = require("fs");
var _data = require("./data");
var https = require("https");
var http = require("http");
var helpers = require("./helpers");
var url = require("url");

var workers = {};

/**
 * Lookup all checks, get their
 * data and send it to validators
 */
workers.gatherAllChecks = function() {
  _data.list("Checks", function(error, checksArray) {
    if (!error && checksArray && checksArray.length > 0) {
      checksArray.forEach(function(check) {
        _data.read("Checks", check, function(err, originalCheckData) {
          if (!error && originalCheckData) {
            workers.validateCheckData(originalCheckData);
          } else {
            console.log("Error reading one of the check's data");
          }
        });
      });
    } else {
      console.log("Error could not find any checks to process");
    }
  });
};

/**
 * Sanity Checking check data
 */
workers.validateCheckData = function(originalCheckData) {
  /**
   * Validating fields
   */
  originalCheckData =
    typeof originalCheckData == "object" && originalCheckData !== null
      ? originalCheckData
      : {};
  originalCheckData.id =
    typeof originalCheckData.id == "string" &&
    originalCheckData.id.trim().length == 20
      ? originalCheckData.id
      : false;
  originalCheckData.userPhone =
    typeof originalCheckData.userPhone == "string" &&
    originalCheckData.userPhone.trim().length == 10
      ? originalCheckData.userPhone
      : false;
  originalCheckData.protocol =
    typeof originalCheckData.protocol == "string" &&
    ["http", "http"].indexOf(originalCheckData.protocol) > -1
      ? originalCheckData.protocol
      : false;
  originalCheckData.url =
    typeof originalCheckData.url == "string" &&
    originalCheckData.url.trim().length > 0
      ? originalCheckData.url
      : false;
  originalCheckData.method =
    typeof originalCheckData.method == "string" &&
    ["post", "get", "put", "delete"].indexOf(
      originalCheckData.method.trim().toLowerCase()
    ) > -1
      ? originalCheckData.method
      : false;
  originalCheckData.successCodes =
    typeof originalCheckData.successCodes == "object" &&
    originalCheckData.successCodes instanceof Array
      ? originalCheckData.successCodes
      : false;
  originalCheckData.timeoutSeconds =
    typeof originalCheckData.timeoutSeconds == "number" &&
    originalCheckData.timeoutSeconds % 1 === 0 &&
    originalCheckData.timeoutSeconds >= 1 &&
    originalCheckData.timeoutSeconds <= 5;

  /**
   * Setting keys if the not already set
   */
  originalCheckData.state =
    typeof originalCheckData.state == "string" &&
    ["UP", "DOWN"].indexOf(originalCheckData.state.toUpperCase()) > -1
      ? originalCheckData.protocol
      : "DOWN";
  originalCheckData.lastChecked =
    typeof originalCheckData.lastChecked == "number" &&
    originalCheckData.timeoutSeconds > 0
      ? originalCheckData.timeoutSeconds
      : false;

  /**
   * If all data is sane, pass the data along
   */
  if (
    originalCheckData.id &&
    originalCheckData.userPhone &&
    originalCheckData.protocol &&
    originalCheckData.url &&
    originalCheckData.method &&
    originalCheckData.successCodes &&
    originalCheckData.timeoutSeconds
  ) {
    console.log("Error: One of the checks is not properly formatted. Skipping");
  } else {
    workers.performCheck(originalCheckData);
  }
};

/**
 * Timer to execute the worker
 * process once per minute
 */
workers.loop = function() {
  setInterval(function() {
    workers.gatherAllChecks();
  }, 1000 * 60);
};

workers.init = function() {
  // Execute all checks
  workers.gatherAllChecks();

  // Call a loop so that checks
  // continue to execute on their own
  workers.loop();
};
module.exports = workers;
