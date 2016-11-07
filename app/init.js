var exec = require('child_process').exec;
var process = require('process');
var parallel = require('async/parallel');



var getConfig = function(cwd, cb){
    var config = {};

    var options = {};
    if (cwd){
        options.cwd = cwd;
    }


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

    parallel([detectGit, detectHg], (error, results) => {
        cb(null, config)
    });
}


var init = function(){
    var config = getConfig();
    //save it too
}

module.exports = {
    getConfig: getConfig,
    init: init
}

