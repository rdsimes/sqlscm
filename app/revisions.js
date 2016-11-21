var exec = require('child_process').exec;

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

module.exports = {
    current: findCurrentRevision,
    target: findTargetRevision,
    first: findFirstRevision,
    diff: diff
};