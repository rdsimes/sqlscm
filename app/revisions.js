var exec = require('child_process').exec;
var series = require('async/series');


function findCurrentRevision (db, cb){
    return db.get("select revision from __SqlscmHistory order by timestamp desc limit 1", function(err, result){
        if(err) return cb(null, null);
        return cb(err, result);
    });
}

function findTargetRevision(config, cb){
    var cmd = config.mode == "git" ? "git rev-parse --short HEAD" : "hg parent";
    return exec(cmd, (error, stdout, stderr) => {   
        var revision = config.mode == "git" ?
        stdout.trim() 
        :stdout.split("\n")[0].split(":")[2];
        return cb(null, revision);
    });
}

var findFirstRevision = function(config, cb){
    if (config.mode == 'hg'){
        return cb(null, 0);
    }
    exec("git rev-list --max-parents=0 HEAD", (error, stdout, stderr) => {
        return cb(null, stdout.trim()); 
    });
};


function diff(sourceRevision, targetRevision, config, cb){
    var cmd = config.mode == "git" ? "git diff --stat " + sourceRevision + " " + targetRevision
    : 'hg diff --stat -r ' + sourceRevision + ":" + targetRevision;

    exec(cmd, cb);
}

function all(db, config, callback){
    series([(cb) => findCurrentRevision(db, cb), 
            (cb) => findTargetRevision(config, cb), 
            (cb) => findFirstRevision(config, cb)], (err, results) => {
                var current = results[0];
                var target = results[1];
                var first = results[2];
                callback(err, {current: current, target: target, first:first});
            });
}


module.exports = {
    current: findCurrentRevision,
    target: findTargetRevision,
    first: findFirstRevision,
    all: all,
    diff: diff
};