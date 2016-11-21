var fs = require('fs');
var dbfactory = require('./db'),
    revisions = require('./revisions'),
    diffparser = require('./diffparser');

module.exports = function(config){

    var db = dbfactory(config);
    function runChanges(downgrades, upgrades, sourceRevision, targetRevision){
        //todo, downgrades need to check out the file in the source revision, while upgrades can use the target or working revision

        upgrades.forEach((u) => {
            console.log("Running: " + u.filePath);          
            db.execFile(u.filePath, (err, result) => {
                if(err){
                    console.error(err);
                    console.error("No changes made, but saving current revision");
                    //return;
                }
                logRevision(u.filePath, targetRevision, console.log);
                console.log("Done");
            });
        });
    }

    function logRevision(filePath, revision, callback){
        db.exec("INSERT INTO __SqlscmHistory(filePath, revision) values('" + filePath + "','" + revision + "')", callback);
    }

    var update = function(sourceRevision, targetRevision){    
        console.log("upgrade from revision:" + sourceRevision + " to " + targetRevision);
        revisions.diff(sourceRevision, targetRevision, config, (error, diff) => {
            var changes = diffparser.parse(diff);            
            if (changes.haschanges) {
                console.log(diffparser.summary(changes));
                runChanges(changes.downgrades, changes.upgrades, sourceRevision, targetRevision);
            } else 
            {
                console.log("no changes found - add and commit a migration to run it");
            }
        });
    };
   
    revisions.all(db, config, (err, revs) => {
        if (err){
            console.log(err);
            return;
        }
        if (!revs.current){
            revs.current = revs.first;
            logRevision('initial revision - (n/a)', revs.current, console.log);
        }
        update(revs.current, revs.target);
    });
};
