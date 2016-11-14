var yargs = require('yargs');

var update = require('./app/update');
var init = require('./app/init');

yargs.usage('$0 <cmd> [args]')
    .command('init', 'Set up sqlscm to manage changes for your database', function (argv) {      
        init.init();
    })
    .command('script', 'Show script to update database', function (argv) {        
        update();//todo
    })
    .command('update', 'Update database', function (argv) {        
        update();
    })
    
    .demand(['cmd'])
    .help()
    .argv