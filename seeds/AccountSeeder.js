var async = require('async'),
    faker = require('faker'),
    AccountService = require('../services/AccountService.js');

exports.run = function(next) {
    // prepare the async funcs to run in an array.
    // Add an account with known username, and create some more
    // random acounts
    var funcs = [];

    funcs.push(function(next) {
        AccountService.createAccount({
            username: 'user1@mail.com',
            first_name: faker.name.firstName(),
            last_name: faker.name.lastName(),
            password: 'secret'
        }, next);
    });

    for (var i = 0; i < 4; i++) {
        funcs.push(function(next) {
            AccountService.createAccount({
                username: faker.internet.email(),
                first_name: faker.name.firstName(),
                last_name: faker.name.lastName(),
                password: 'secret'
            }, next);
        });
    }

    async.series(funcs, next);
};
