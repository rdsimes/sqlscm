var execProcess = require('child_process').exec;
var escape = require('jsesc');

module.exports = (config) => {

    var get = function(sql, cb){
        var cmd = config.dbcmd + '"' + sql + '"';
        execProcess(cmd, (error, stdout, stderr) => {   
            cb(error, stdout.trim());
        });
        //console.log(sql);
    }

    var exec = function(sql, cb){
        var cmd = config.dbcmd + '"' + sql + '"';
        execProcess(cmd, (error, stdout, stderr) => {   
            cb(error, stdout);
        });
    }

    var execFile = function(filePath, cb){
        var cmd = config.dbcmd + ' < ' + filePath;
        execProcess(cmd, (error, stdout, stderr) => {   
            cb(error, stdout);
        });
        
    }

    return {
        get:get,
        exec:exec,
        execFile:execFile
    }
};