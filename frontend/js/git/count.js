var $ = require("jquery");
var Chart = require("chart.js");

var labels = [];
var chart;
var titleElement;

function getCount() {
  return $.get("/git/commit-count");
}

function setTitle(title) {
  titleElement.innerHTML = title;
}

function initialize(ctx) {
  getCount().then(function (count) {
    var counts = [];
    count.map(function (authordata) {
      labels.push(authordata.author);
      counts.push(authordata.total);
    });
    var datasets = {
      labels: labels,
      datasets: [
        {
          fillColor: "rgba(90, 90, 255, 0.5)",
          strokeColor: "rgba(90, 90, 255, 0.8)",
          highlightFill: "rgba(90, 90, 255, 0.75)",
          highlightStroke: "rgba(90, 90, 255, 1)",
          data: counts
        }
      ]
    };
    chart = new Chart(ctx).Bar(datasets, {
      responsive: true
    });
    setTitle("All time");
  });
}

module.exports = function(title, ctx) {
  titleElement = title;
  initialize(ctx.getContext("2d"));
};
