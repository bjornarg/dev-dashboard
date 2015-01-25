var stats = require("./stats");
var count = require("./count");

stats(document.getElementById("commit-stats-title"), document.getElementById("commit-stats-canvas"));
count(document.getElementById("commit-count-title"), document.getElementById("commit-count-canvas"));
