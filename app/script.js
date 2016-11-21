var fs = require('fs');
var series = require('async/series');
var os = require('os');
var dbfactory = require('./db'),
    revisions = require('./revisions'),
    diffparser = require('./diffparser');

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

    var createUpdateScript = function(sourceRevision, targetRevision, cb){    
        revisions.diff(sourceRevision, targetRevision, config, (error, diff) => {
            var changes = diffparser.parse(diff);            
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

    series([(cb) => revisions.current(db, cb), 
            (cb) => revisions.target(config, cb), 
            (cb) => revisions.first(config, cb)], function (err, results){
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
