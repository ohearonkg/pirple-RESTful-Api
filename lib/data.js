/**
 * This file is used to read and write
 * data from our file system simulating
 * a database
 *
 * This library follows the error back pattern
 * where a FALSE error will subsequently be a good
 * thing and indicate we have no error
 */

var fs = require("fs");
var path = require("path");

var lib = {};

// Base directory where our files will live
lib.baseDir = path.join(__dirname, "/../.data/");

/**
 * This function is responsible for creating a file
 * with the data passed to it
 */
lib.create = function(dir, fileName, data, callBack) {
  fs.open(lib.baseDir + dir + "/" + fileName + ".json", "wx", function(
    error,
    fileDescriptor
  ) {
    if (!error && fileDescriptor) {
      var stringData = JSON.stringify(data);
      fs.writeFile(fileDescriptor, stringData, function(error) {
        if (!error) {
          fs.close(fileDescriptor, function(error) {
            if (!error) {
              callBack(false);
            } else {
              callback("Error Closing The File");
            }
          });
        } else {
          callback("Error Writing To The File");
        }
      });
    } else {
      callback("Could Not Create The File. It Most Likely Already Exists");
    }
  });
};

/**
 * This function shall read a file
 */
lib.read = function(dir, fileName, callback) {
  fs.readFile(lib.baseDir + dir + "/" + fileName + ".json", "utf-8", function(
    error,
    data
  ) {
    callback(error, data);
  });
};

module.exports = lib;
