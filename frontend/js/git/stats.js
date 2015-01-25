var $ = require("jquery");
var Chart = require("chart.js");
var moment = require("moment");

var filters = [
  ["All time", undefined],
  ["This year", moment().day(-6).second(0).minute(0).hour(0).dayOfYear(1).toDate()],
  ["This week", moment().day(-6).second(0).minute(0).hour(0).toDate()],
  ["Last 7 days", moment().subtract(7, 'days').toDate()]
];

var labels = [];
var chart;
var filterIdx = 1;
var ROTATION_DELAY = 5000;
var titleElement;

function getStats(filters) {
  var filter = {start: filters[1]};
  return $.get("/git/authors", filter);
}

function setTitle(filters) {
  titleElement.innerHTML = filters[0];
}

function initialize(ctx) {
  getStats(filters[0]).then(function (stats) {
    var additions = [];
    var deletions = [];
    stats.map(function (authordata) {
      labels.push(authordata.author);
      additions.push(authordata.additions);
      deletions.push(authordata.deletions);
    });
    var datasets = {
      labels: labels,
      datasets: [
        {
          fillColor: "rgba(90, 255, 90, 0.5)",
          strokeColor: "rgba(90, 255, 90, 0.8)",
          highlightFill: "rgba(90, 255, 90, 0.75)",
          highlightStroke: "rgba(90, 255, 90, 1)",
          data: additions
        },
        {
          fillColor: "rgba(255, 90, 90, 0.5)",
          strokeColor: "rgba(255, 90, 90, 0.8)",
          highlightFill: "rgba(255, 90, 90, 0.75)",
          highlightStroke: "rgba(255, 90, 90, 1)",
          data: deletions
        }
      ]
    };
    chart = new Chart(ctx).Bar(datasets, {
      barShowStroke: false
    });
    setTitle(filters[0]);
    setTimeout(update, ROTATION_DELAY);
  });
}

function clearData() {
  chart.datasets.forEach(function (dataset) {
    dataset.bars.forEach(function (bar) {
      bar.value = 0;
    });
  });
}

function update() {
  getStats(filters[filterIdx]).then(function (stats) {
    clearData();
    stats.forEach(function (stat) {
      var authorIdx = labels.indexOf(stat.author);
      if (authorIdx < 0) {
        chart.addData([stat.additions, stat.deletions], stat.author);
      } else {
        chart.datasets[0].bars[authorIdx].value = stat.additions;
        chart.datasets[1].bars[authorIdx].value = stat.deletions;
      }
    });
    setTitle(filters[filterIdx]);
    chart.update();
    filterIdx = (filterIdx+1) % filters.length;
    setTimeout(update, ROTATION_DELAY);
  });
}

module.exports = function (title, ctx) {
  titleElement = title;
  initialize(ctx.getContext("2d"));
};
