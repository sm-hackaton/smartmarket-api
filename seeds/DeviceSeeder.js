var _ = require('lodash'),
    async = require('async'),
    faker = require('faker'),
    AccountService = require('../services/AccountService.js'),
    DeviceService = require('../services/DeviceService.js'),
    TransactionService = require('../services/TransactionService.js');

exports.run = function(next) {
    var funcs = [];

    // id 1
    funcs.push(function(next) {
        DeviceService.createDevice({
            manager_id: 1,
            seller_id: 2,
            description: faker.lorem.sentence()
        }, next);
    });

    // id 2
    funcs.push(function(next) {
        DeviceService.createDevice({
            manager_id: 1,
            seller_id: 2,
            description: faker.lorem.sentence()
        }, next);
    });

    var numDevices = funcs.length,
        statusArr = [
            TransactionService.STATUS_PENDING,
            TransactionService.STATUS_ACCEPTED,
            TransactionService.STATUS_REJECTED
        ];

    for (var i = 0; i < numDevices; i++) {
        funcs.push(function(next) {
            TransactionService.createTransaction({
                device_id: 1,
                status: statusArr[_.random(0, statusArr.length-1)],
                amount: _.random(5, 80)
            }, next);
        });
    }

    async.series(funcs, next);
};
