var exec = require('child_process').exec;
var fs = require('fs');
//var sqlite3 = require('sqlite3');
var series = require('async/series');
var dbfactory = require('./db');

module.exports = function(config){

var db = dbfactory(config);

function findChanges(diffSummary){
    var dbChanges = diffSummary
        .split('\n')
        .map(matchDbChangeInSummary)
        .filter((changes) => changes && changes.length)
        .map((change) =>  {
            return { filePath: change[1], 
                    additions: change[2].split('+').length-1, 
                    deletions: change[2].split('-').length-1,
                    isUp: change[1].endsWith('up.sql')
                };
            });
    return dbChanges;
}

function matchDbChangeInSummary(diffSummaryLine){
    /*
    Finds the path to the sql file AND the indication of line adds/removes in the output from hg diff --stat
    eg for input: ' Database/CreateFirstTable.up.sql   |   4 ++++' ] ]
    it should capture the file path: 'Database/CreateFirstTable.up.sql',
    and the plus symbols: '++++',
    */
    return / (.+.sql)[^-+]*([+-]+)/i.exec(diffSummaryLine);
}


function runChanges(downgrades, upgrades, sourceRevision, targetRevision){
    //todo, downgrades need to check out the file in the source revision, while upgrades can use the target or working revision

    upgrades.forEach((u) => fs.readFile(u.filePath, 'utf8', function(err, data) {
        if (err) throw err;
        console.log("Running: " + u.filePath);
        db.exec(data);
        db.run("INSERT INTO __ScumHistory(filePath, revision) values(?, ?)", [u.filePath, targetRevision]);
        console.log("Done");
    }));
}

function findCurrentRevision (cb){
   return db.get("select revision from __ScumHistory order by timestamp desc limit 1", function(err, result){
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

var update = function(sourceRevision, targetRevision){
    if (config.mode == "git" && sourceRevision == 0){
        sourceRevision = "HEAD";
    }
    console.log("upgrade from revision:" + sourceRevision + " to " + targetRevision);
    var cmd = config.mode == "git" ? 
    "git diff --stat " + sourceRevision + " " + targetRevision
    : 'hg diff --stat -r ' + sourceRevision + ":" + targetRevision;
    exec(cmd, function(error, stdout, stderr) {
        console.log(cmd, error, stdout, stderr);
        var changes = findChanges(stdout);
        var upgrades = changes.filter((c) => c.isUp && c.additions >= c.deletions);
        var downgrades = changes.filter((c) => !c.isUp && c.additions < c.deletions);
        
        if (changes && changes.length > 0) {
            console.log("DB Changes:");
            console.log(downgrades.reduce(
                (previous, current) => previous + "\n" + current.filePath, 
                downgrades.length + " downgrades:"));
            console.log(upgrades.reduce(
                (previous, current) => previous + "\n" + current.filePath, 
                upgrades.length + " upgrades:"));

            runChanges(downgrades, upgrades, sourceRevision, targetRevision);
            
        } else 
        {
            console.log("no changes found - add and commit a migration to run it");
        }
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
    current = results[0];
    target = results[1];
    first = results[2];
    
    if (current){
        current = current.revision;
    } else {
        current = first;
    } 

    if (err){
        console.log(err);
        return;
    }
    update(current, target);
});
};
