var Promise = require("promise");
var nodegit = require("nodegit");
var path = require("path");

var MINUS = "-".charCodeAt(0);
var PLUS = "+".charCodeAt(0);

function commitHistory(commit) {
  return new Promise(function (resolve, reject) {
    var history = commit.history();

    history.on("end", function (commits) {
      resolve(commits);
    });

    history.start();
  });
}

function branchCommits(repository, branch) {
  return new Promise(function (resolve, reject) {
    repository.getCommit(branch.target()).then(function (commit) {
      return commitHistory(commit);
    }).then(function (commits) {
      resolve({branch: branch, commits: commits});
    });
  });
}

function getCommitStats(commit, branches) {
  return commit.getParents().then(function (parents) {
    parents = parents || [];
    parents = parents.map(function (parent) {
      return parent.sha();
    });
    return commit.getDiff().then(function (diffs) {
      var stats = {
        sha: commit.sha(),
           msg: commit.message().trim(), // Fix enconding? messageEncoding() has it
           author: {
             email: commit.author().email(),
             name: commit.author().name()
           },
           committer: {
             email: commit.committer().email(),
             name: commit.committer().name()
           },
           date: commit.date(),
           branches: branches,
           parents: parents,
           files: []
      };
      diffs.forEach(function (diff) {
        diff.patches().forEach(function (patch) {
          var file = {
            oldName: patch.oldFile().path(),
            newName: patch.newFile().path(),
            additions: 0,
            deletions: 0,
            filetype: path.extname(patch.newFile().path())
          };
          patch.hunks().forEach(function (hunk) {
            hunk.lines().forEach(function (line) {
              if (PLUS === line.origin()) {
                file.deletions++;
              } else if (MINUS === line.origin()) {
                file.additions++;
              }
            });
          });
          stats.files.push(file);
        });
      });
      return stats;
    });
  });
}

function mergeCommits(branches) {
  var combos = {};
  branches.forEach(function (branch) {
    branch.commits.forEach(function (commit) {
      if (!(commit.sha() in combos)) {
        combos[commit.sha()] = {commit: commit, branches: [branch.branch.name()]};
      } else {
        combos[commit.sha()].branches.push(branch.branch.name());
      }
    });
  });
  var promises = [];
  for (var sha in combos) {
    promises.push(getCommitStats(
      combos[sha].commit,
      combos[sha].branches
    ));
  }
  return Promise.all(promises);
}

function indexRepository(path) {
  var repository;
  return nodegit.Repository.open(path).then(function (repo) {
    repository = repo;
    return repo.getReferences();
  }).then(function (reflist) {
    var promises = [];

    reflist.forEach(function (ref) {
      promises.push(branchCommits(repository, ref));
    });

    return Promise.all(promises);
  }).then(function (branches) {
    return mergeCommits(branches);
  }).then(function (stats) {
    return stats;
  });
}

module.exports = indexRepository;
