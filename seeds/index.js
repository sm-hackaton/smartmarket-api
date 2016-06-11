var fs = require('fs'),
    path = require('path'),
    async = require('async'),
    DatabaseService = require('../services/DatabaseService.js');

DatabaseService.connect({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS
});

var currentFilename = path.basename(__filename),
    seeders = [];

fs.readdirSync(__dirname).forEach(function(file) {
    // ignore current file and any non-js files
    if (file === currentFilename || !file.endsWith('.js'))
        return;

    seeders.push(function(next) {
        console.log('running '+file+' ...');
        require('./'+file).run(next);
    });
});

async.series(seeders, function() {
    console.log('finished running seeders');
    DatabaseService.end();
});
