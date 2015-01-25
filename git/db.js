var Promise = require("promise");
var mongoose = require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;

var personSchema = new mongoose.Schema({
  name: {type: String, index: true},
  email: {type: [String], index: true, unique: true}
});

personSchema.statics.findPerson = function (email) {
  var schema = this;
  return new Promise(function (resolve, reject) {
    schema
      .find({email: email})
      .exec(function (err, results) {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
  });
};

var Person = mongoose.model("Person", personSchema, "Person");

module.exports.Person = Person;

var commitSchema = new mongoose.Schema({
  sha: {type: String, index: true, unique: true},
  msg: String,
  author: {type: ObjectId, ref: "Person", index: true},
  committer: {type: ObjectId, ref: "Person", index: true},
  date: Date,
  branches: {type: [String], index: true},
  parents: [String],
  files: [
    {
      oldName: String,
      newName: String,
      additions: Number,
      deletions: Number,
      filetype: String
    }
  ]
});

commitSchema.statics.saveCommits = function (commits) {
  var schema = this;
  var promises = [];
  commits.forEach(function (commit) {
    promises.push(new Promise(function (resolve, reject) {
      Person.findOneAndUpdate(
        {$or: [{email: commit.author.email}, {name: commit.author.name}]},
        {email: commit.author.email, name: commit.author.name},
        {upsert: true},
        function (err, author) {
          if (err) {
            throw new Error(err);
          }
          schema.findOneAndUpdate(
            {sha: commit.sha},
            {
              sha: commit.sha,
              msg: commit.msg,
              author: author._id,
              date: commit.date,
              branches: commit.branches,
              parents: commit.parents,
              files: commit.files
            },
            {upsert: true},
            function (err, data) {
              if (err) {
                throw new Error(err);
              }
              resolve();
            }
          );
        }
      );
    }));
  });

  return Promise.all(promises);
};

module.exports.Commit = mongoose.model("Commit", commitSchema, "Commit");
