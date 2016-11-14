var exec = require('child_process').exec;
var process = require('process');
var parallel = require('async/parallel');
var readline = require('readline');

var config;
var options;

const input = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
    
var detectGit = function(callback){
    exec("git rev-parse --is-inside-work-tree", options, (error, stdout, stderr) => {
        if(stdout == "true\n"){
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
/*
  */

    parallel(configFinders, (error, results) => {
        cb(null, config)
    });
}


var init = function(){
    return getConfig(silentConfigFinders.concat(interactiveConfigFinders), null, (error, data) => {
       console.log(data);
       input.close();
   });
}

module.exports = {
    getConfig: getConfig,
    init: init
}

