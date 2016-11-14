var exec = require('child_process').exec;
var process = require('process');
var series = require('async/series');
var readline = require('readline');
var fs = require('fs');

var config;
var options;

const input = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
    
var detectGit = function(callback){
    exec("git rev-parse --is-inside-work-tree", options, (error, stdout, stderr) => {
        if(stdout == "true\n"){
            console.log("\nDetected git repository, setting mode to: git\n")
            config.mode = "git";
        }
        callback();
    });
};

var detectHg = function(callback){
    exec("hg root", options, (error, stdout, stderr) => {
        if(!error){
            config.mode = "hg";
        }
        callback();
    });
};

var requestDbType = (callback) => {
    input.question('Database?[sqlserver|sqlite]', (answer) => {
        config.db = answer;
        callback();
    });
};


var silentConfigFinders = [detectHg, detectGit];
var interactiveConfigFinders = [requestDbType];

var getConfig = function(configFinders, cwd, cb){
    configFinders = configFinders || silentConfigFinders;
    config = {}; //reset config
    options = {};

    if (cwd){
        options.cwd = cwd;
    }
    //parallel would sort-of-work, but confuses interactive input/output
    series(configFinders, (error, results) => {
        cb(null, config)
    });
}


var init = function(){
    console.log("Configuring for database changes")
    getConfig(silentConfigFinders.concat(interactiveConfigFinders), null, (error, data) => {
       //console.log(data);
       var fileName = 'sqlscm.json';
       console.log('Saving config to: ' + fileName);
       fs.writeFile(fileName, JSON.stringify(data));
       input.close();
   });
}

module.exports = {
    getConfig: getConfig,
    init: init
}

