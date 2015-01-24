var router = require("express").Router();
var db = require("./db");

router.get("/", function (req, res) {
  var o = {
    map: function () {
      if (this.parents.length === 1) {
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
    }
  };

  db.Commit.mapReduce(o, function (err, results) {
    if (err) {
      res.send(err);
    } else {
      res.send(results);
    }
  });
});

module.exports = router;
