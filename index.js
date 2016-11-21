var yargs = require('yargs');
var fs = require('fs');

var update = require('./app/update'),
    init = require('./app/init'),
    script = require('./app/script');

fs.readFile('sqlscm.json', (err, data) => {
    var config;
    if (err){
        //fine... sqlscm needs to be set up
    } else {
        config = JSON.parse(data);
    }


    yargs.usage('$0 <cmd> [args]')
        .command('init', 'Set up sqlscm to manage changes for your database', function (argv) {      
            init.init();
        })
        .command('script', 'Show script to update database', function (argv) {        
            script(config, (err, sql) => {console.log(sql)});
        })
        .command('update', 'Update database', function (argv) {        
            update(config);
        })
        
        .demand(['cmd'])
        .help()
        .argv
});

