var os = require('os');

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


var parse = function(diffSummary){

    var changes = findChanges(diffSummary);

    var upgrades = changes.filter((c) => c.isUp && c.additions >= c.deletions);
    var downgrades = changes.filter((c) => !c.isUp && c.additions < c.deletions);

    return {
        haschanges: (changes && changes.length > 0),
        upgrades: upgrades,
        downgrades: downgrades        
    }   
}

var summary = function(changes){
    var result = "Summary: " + os.EOL;
    result += (changes.downgrades.reduce(
        (previous, current) => previous + os.EOL + current.filePath,
        changes.downgrades.length + " downgrades:"));
    result += (changes.upgrades.reduce(
        (previous, current) => previous + os.EOL + current.filePath, 
        changes.upgrades.length + " upgrades:"));
    return result;
}

module.exports = {
    parse:parse,
    summary: summary
};