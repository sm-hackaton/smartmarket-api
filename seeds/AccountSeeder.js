var async = require('async'),
    faker = require('faker'),
    AccountService = require('../services/AccountService.js');

exports.run = function(next) {
    // prepare the async funcs to run in an array
    var funcs = [];

    // id 1
    funcs.push(function(next) {
        AccountService.createManagerAccount({
            username: 'manager1@mail.com',
            first_name: faker.name.firstName(),
            last_name: faker.name.lastName(),
            password: 'secret'
        }, next);
    });

    // id 2
    funcs.push(function(next) {
        AccountService.createSellerAccount({
            manager_id: 1,
            username: 'seller1@mail.com',
            first_name: faker.name.firstName(),
            last_name: faker.name.lastName(),
            password: 'secret'
        }, next);
    });

    funcs.push(function(next) {
        AccountService.createSellerAccount({
            manager_id: 1,
            username: 'seller2@mail.com',
            first_name: faker.name.firstName(),
            last_name: faker.name.lastName(),
            password: 'secret'
        }, next);
    });

    funcs.push(function(next) {
        AccountService.createBuyerAccount({
            username: 'buyer1@mail.com',
            first_name: faker.name.firstName(),
            last_name: faker.name.lastName(),
            password: 'secret'
        }, next);
    });

    funcs.push(function(next) {
        AccountService.createBuyerAccount({
            username: 'buyer2@mail.com',
            first_name: faker.name.firstName(),
            last_name: faker.name.lastName(),
            password: 'secret'
        }, next);
    });

    funcs.push(function(next) {
        AccountService.createBuyerAccount({
            username: 'buyer3@mail.com',
            first_name: faker.name.firstName(),
            last_name: faker.name.lastName(),
            password: 'secret'
        }, next);
    });

    async.series(funcs, next);
};
