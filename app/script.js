var exec = require('child_process').exec;
var fs = require('fs');
var series = require('async/series');
var diffparser = require('./diffparser');
var os = require('os');
var dbfactory = require('./db');

module.exports = function(config, callback){
    var sql = '';    

    var db = dbfactory(config);


function runChanges(downgrades, upgrades, sourceRevision, targetRevision){
    sql += "-- upgrading from " + sourceRevision + " to " + targetRevision;
    upgrades.forEach((u) => {
        fs.readFile(u.filePath, (err, result) => {
            if(err){
                console.error(err);
            }
            sql += "-- path: " + u.filePath + os.EOL;
            sql += result;
            logRevision(u.filePath, targetRevision);
        });
    });
}

function logRevision(filePath, revision){
    sql += os.EOL + "INSERT INTO __SqlscmHistory(filePath, revision) values('" + filePath + "','" + revision + "')";
}

function findCurrentRevision (cb){
   return db.get("select revision from __SqlscmHistory order by timestamp desc limit 1", function(err, result){
        if(err) return cb(null, null);
        return cb(err, result);
    });
}

function findTargetRevision(cb){
    var cmd = config.mode == "git" ? "git rev-parse --short HEAD" : "hg parent";
    return exec(cmd, (error, stdout, stderr) => {   
        var revision = config.mode == "git" ?
        stdout.trim() 
        :stdout.split("\n")[0].split(":")[2];
        return cb(null, revision);
    });
}

var createUpdateScript = function(sourceRevision, targetRevision, cb){
 
    var cmd = config.mode == "git" ? 
    "git diff --stat " + sourceRevision + " " + targetRevision
    : 'hg diff --stat -r ' + sourceRevision + ":" + targetRevision;
    exec(cmd, function(error, stdout, stderr) {
        var changes = diffparser.parse(stdout);
        
        if (changes.haschanges) {
            sql += "/* " + diffparser.summary(changes) + " */" + os.EOL;
            runChanges(changes.downgrades, changes.upgrades, sourceRevision, targetRevision);
            
        } else 
        {
            console.log("no changes found - add and commit a migration to run it");
        }
           cb(null, sql);
         
    });
};

var findFirstRevision = function(cb){
    if (config.mode == 'hg'){
        return cb(null, 0);
    }
    exec("git rev-list --max-parents=0 HEAD", (error, stdout, stderr) => {
        return cb(null, stdout.trim()); 
    });
};


series([findCurrentRevision, findTargetRevision, findFirstRevision], function (err, results){
    var current = results[0];
    var target = results[1];
    var first = results[2];
    
    if (!current){
        current = first;
        logRevision('initial revision - (n/a)', current, console.log);
    } 

    if (err){
        console.log(err);
        return;
    }
    createUpdateScript(current, target, callback);
});
};
