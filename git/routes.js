var router = require("express").Router();
var db = require("./db");

/** Gets total additions/deletions made grouped by author.
 *
 */
router.get("/commit-stats", function (req, res) {
  var start = new Date(1971, 0, 1);
  if (req.query.start) {
    start = new Date(req.query.start);
  }
  var o = {
    map: function () {
      if (this.parents.length === 1 && this.date >= start) {
        for (var i = 0; i < this.files.length; i++) {
          emit(this.author,
            {
              additions: this.files[i].additions,
              deletions: this.files[i].deletions
            });
        }
      }
    },
    reduce: function (key, values) {
      var obj = {additions: 0, deletions: 0};
      values.map(function (value) {
        obj.additions += value.additions;
        obj.deletions += value.deletions;
      });
      return obj;
    },
    out: {
      replace: 'PersonReduce'
    },
    scope: {
      start: start
    }
  };

  db.Commit.mapReduce(o, function (err, model) {
    if (err) {
      res.send(err);
    } else {
      model.find().populate({
        path: "_id",
        model: "Person"
      }).exec(function (err, results) {
        if (err) {
          res.send(err);
        } else {
          var data = results.map(function (result) {
            return {
              author: result._id.name,
              additions: result.value.additions,
              deletions: result.value.deletions
            };
          });
          res.send(data);
        }
      });
    }
  });
});

/** Gets the commit count grouped by author.
 *
 */
router.get("/commit-count", function (req, res) {
  db.Commit.aggregate({$group:
    {
      _id: "$author",
      total: {$sum: 1}
    }
  }, function (err, commits) {
    if (err) {
      res.send(err);
    } else {
      db.Person.populate(commits, {path: "_id"}, function (err, authors) {
        if (err) {
          res.send(err);
        } else {
          var data = authors.map(function (author) {
            return {
              author: author._id.name,
              total: author.total
            };
          });
          res.send(data);
        }
      });
    }
  });
});

module.exports = router;
