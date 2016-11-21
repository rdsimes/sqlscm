var fs = require('fs');
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
    revisions.all(db, config, (err, revs) => {
        
        if (!revs.current){
            revs.current = revs.first;
            logRevision('initial revision - (n/a)', revs.current);
        } 

        if (err){
            console.log(err);
            return;
        }
        createUpdateScript(revs.current, revs.target, callback);
    });
};
