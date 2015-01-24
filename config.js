var fs = require("fs");
var path = require("path");

module.exports = function (conf) {
  conf = conf || path.join(__dirname, "dev-dashboard.json");
  if (!fs.existsSync(conf)) {
    throw new Error("Missing configuration file.");
  }

  return require(conf);
};
