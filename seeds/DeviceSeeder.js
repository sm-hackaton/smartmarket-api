var _ = require('lodash'),
    async = require('async'),
    faker = require('faker'),
    AccountService = require('../services/AccountService.js'),
    DeviceService = require('../services/DeviceService.js'),
    TransactionService = require('../services/TransactionService.js');

exports.run = function(next) {
    AccountService.getAccounts(function(err, accounts) {
        var funcs = [];

        accounts.forEach(function(account) {
            // make sure 'user1@mail.com' has 3 devices associated
            var numDevices = (account.username === 'user1@mail.com') ? 5 : _.random(0, 2);

            for (var i = 0; i < numDevices; i++) {
                funcs.push(function(next) {
                    DeviceService.createDevice({
                        account_id: account.id,
                        description: faker.lorem.sentence()
                    }, function(err, device) {
                        var transFuncs = [],
                            numTransactions = _.random(1, 5),
                            statusArr = [
                                TransactionService.STATUS_PENDING,
                                TransactionService.STATUS_ACCEPTED,
                                TransactionService.STATUS_REJECTED
                            ];

                        for (var i = 0; i < numTransactions; i++) {
                            transFuncs.push(function(next) {
                                TransactionService.createTransaction({
                                    device_id: device.id,
                                    status: statusArr[_.random(0, statusArr.length-1)]
                                }, next);
                            });
                        }

                        async.series(transFuncs, next);
                    });
                });
            }
        });

        async.series(funcs, next);
    });
};
