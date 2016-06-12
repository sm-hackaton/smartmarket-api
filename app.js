var _ = require('lodash'),
    async = require('async'),
    express = require('express'),
    cors = require('cors'),
    bodyParser = require('body-parser');

var DatabaseService = require('./services/DatabaseService.js'),
    AccountService = require('./services/AccountService.js'),
    DeviceService = require('./services/DeviceService.js'),
    TransactionService = require('./services/TransactionService.js'),
    OpenBankService = require('./services/OpenBankService.js');

function filterFields(obj, fields, reverse) {
    var isSingleObj = !Array.isArray(obj);

    if (isSingleObj) {
        obj = [obj];
    }

    // index fields by key to look them up easily
    var fieldsObj = {};
    fields.forEach(function(f) {
        fieldsObj[f] = true;
    });

    obj.forEach(function(elem) {
        var keys = Object.keys(elem);

        for (var i = 0; i < keys.length; i++) {
            var key = keys[i], fieldFound = fieldsObj[key];
            if ((!fieldFound && !reverse) || (fieldFound && reverse)) {
                delete elem[key];
            }
        }
    });

    return isSingleObj ? obj[0] : obj;
}

function filterAccountFields(obj) {
    return filterFields(obj, ['uuid', 'username', 'first_name', 'last_name']);
}

function filterDeviceFields(obj) {
    return filterFields(obj, ['uuid', 'description']);
}

function filterTransactionFields(obj) {
    return filterFields(obj, ['id'], true);
}

function loadAccountsRelations(accounts, next) {
    var funcs = [];

    var strAccounts = {};
    strAccounts[AccountService.TYPE_MANAGER] = 'manager';
    strAccounts[AccountService.TYPE_SELLER] = 'seller';
    strAccounts[AccountService.TYPE_BUYER] = 'buyer';

    accounts.forEach(function(account) {
        account.type = strAccounts[account.type];

        funcs.push(function(next) {
            if (account.type === AccountService.TYPE_MANAGER) {
                DeviceService.getDevicesWithManagerId(account.id, function(err, devices) {
                    account.devices = filterDeviceFields(devices);
                    next();
                });
            } else if (account.type === AccountService.TYPE_SELLER) {
                DeviceService.getDevicesWithSellerId(account.id, function(err, devices) {
                    account.devices = filterDeviceFields(devices);
                    next();
                });
            } else {
                next();
            }
        });
    });

    async.series(funcs, function() {
        filterFields(accounts, ['uuid', 'username', 'first_name', 'last_name', 'type', 'devices']);
        next(null, accounts);
    });
}

function loadDevicesRelations(devices, next) {
    var funcs = [];

    devices.forEach(function(device) {
        funcs.push(function(next) {
            if (device.seller_id) {
                 AccountService.findAccountById(device.seller_id, function(err, account) {
                    device.seller = filterAccountFields(account);
                    next();
                });
            } else {
                device.seller = null;
                next();
            }
        });

        funcs.push(function(next) {
            if (device.manager_id) {
                 AccountService.findAccountById(device.manager_id, function(err, account) {
                    device.manager = filterAccountFields(account);
                    next();
                });
            } else {
                device.manager = null;
                next();
            }
        });
    });

    async.series(funcs, function() {
        filterFields(devices, ['uuid', 'description', 'seller', 'manager']);
        next(null, devices);
    });
}

function loadTransactionsRelations(transactions, next) {
    var funcs = [];

    var strStatus = {};
    strStatus[TransactionService.STATUS_PENDING] = 'pending';
    strStatus[TransactionService.STATUS_ACCEPTED] = 'accepted';
    strStatus[TransactionService.STATUS_REJECTED] = 'rejected';

    transactions.forEach(function(transaction) {
        transaction.status = strStatus[transaction.status];

        funcs.push(function(next) {
            DeviceService.findDeviceById(transaction.device_id, function(err, device) {
                transaction.device = filterDeviceFields(device);
                next();
            });
        });
    });

    async.series(funcs, function() {
        filterFields(transactions, ['uuid', 'status', 'device', 'amount']);
        next(null, transactions);
    });
}


DatabaseService.connect({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS
});

process.on('exit', function() {
    console.log();
    console.log('cleanup before closing ...');
    DatabaseService.end();
});

process.on('SIGINT', function() {
    process.exit();
});

var app = express(),
    router = express.Router();

// allow cross-origin requests
app.use(cors());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// parse application/json
app.use(bodyParser.json());

router.post('/auth', function(req, res) {
    AccountService.authenticate(req.body.username, req.body.password, function(err, success, account) {
        if (success) {
            AccountService.findAccountById(account.id, function(err, account) {
                loadAccountsRelations([account], function(err, accounts) {
                    res.json({account: accounts[0]});
                });
            });
        } else {
            res.status(401).json({message: 'Unauthorized, invalid credentials'});
        }
    });
});

router.post('/accounts', function(req, res) {
    AccountService.createAccount({
        username: req.body.username,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        password: req.body.password
    }, function(err, account) {
        res.json({account: filterAccountFields(account)});
    });
});

router.get('/accounts', function(req, res) {
    AccountService.getAccounts(function(err, accounts) {
        loadAccountsRelations(accounts, function(err, accounts) {
            res.json({accounts: accounts});
        });
    });
});

router.get('/accounts/:uuid', function(req, res) {
    AccountService.findAccountByUuid(req.params.uuid, function(err, account) {
        loadAccountsRelations([account], function(err, accounts) {
            res.json({account: accounts[0]});
        });
    });
});

router.put('/accounts/:uuid', function(req, res) {
    AccountService.updateAccountByUuid(req.params.uuid, req.body, function(err, account) {
        res.json({account: filterAccountFields(account)});
    });
});

router.get('/accounts/:uuid/setup-obc', function(req, res) {
    AccountService.findAccountByUuid(req.params.uuid, function(err, account) {
        var oauthConfirmUrl = 'http://localhost:8080/accounts/'+req.params.uuid+'/setup-obc-confirm',
            obank = OpenBankService(oauthConfirmUrl, account.consumer_key, account.consumer_secret);

        obank.getRequestToken(function(err, requestToken, requestTokenSecret) {
            AccountService.updateAccountByUuid(req.params.uuid, {
                req_token: requestToken,
                req_secret: requestTokenSecret
            }, function() {
                var authorizeUrl = obank.getAuthorizeUrl(requestToken);
                res.json({authorize_url: authorizeUrl});
            });
        });
    });
});

router.post('/accounts/:uuid/setup-obc', function(req, res) {
    if (!req.body.consumer_key) {
        return res.status(400).json({message: "required field 'consumer_key' is missing"});
    }

    if (!req.body.consumer_secret) {
        return res.status(400).json({message: "required field 'consumer_secret' is missing"});
    }

    if (!req.body.bank_id) {
        return res.status(400).json({message: "required field 'bank_id' is missing"});
    }

    if (!req.body.account_id) {
        return res.status(400).json({message: "required field 'account_id' is missing"});
    }

    var oauthConfirmUrl = 'http://localhost:8080/accounts/'+req.params.uuid+'/setup-obc-confirm',
        obank = OpenBankService(oauthConfirmUrl, req.body.consumer_key, req.body.consumer_secret);

    obank.getRequestToken(function(err, requestToken, requestTokenSecret) {
        AccountService.updateAccountByUuid(req.params.uuid, {
            bank_id: req.body.bank_id,
            account_id: req.body.account_id,
            consumer_key: req.body.consumer_key,
            consumer_secret: req.body.consumer_secret,
            req_token: requestToken,
            req_secret: requestTokenSecret
        }, function() {
            var authorizeUrl = obank.getAuthorizeUrl(requestToken);
            res.json({authorize_url: authorizeUrl});
        });
    });
});

router.get('/accounts/:uuid/setup-obc-confirm', function(req, res) {
    if (!req.query.oauth_verifier) {
        return res.status(400).json({message: "required field 'oauth_verifier' is missing"});
    }

    AccountService.findAccountByUuid(req.params.uuid, function(err, account) {
        var oauthConfirmUrl = 'http://localhost:8080/accounts/'+account.uuid+'/setup-obc-confirm',
            obank = OpenBankService(oauthConfirmUrl, account.consumer_key, account.consumer_secret);

        obank.getAccessToken(
            account.req_token,
            account.req_secret,
            req.query.oauth_verifier,
            function(err, accessToken, accessSecret) {
                AccountService.updateAccountById(account.id, {
                    access_token: accessToken,
                    access_secret: accessSecret
                }, function() {
                    res.json({success: true});
                });
            }
        );
    });
});

router.get('/accounts/:uuid/banks', function(req, res) {
    AccountService.findAccountByUuid(req.params.uuid, function(err, account) {
        var oauthConfirmUrl = 'http://localhost:8080/accounts/'+account.uuid+'/setup-obc-confirm',
            obank = OpenBankService(oauthConfirmUrl, account.consumer_key, account.consumer_secret);

        obank.getBanks(account, function(err, banks) {
            res.json({banks: banks});
        });
    });
});

router.get('/accounts/:uuid/trans', function(req, res) {
    AccountService.findAccountByUuid(req.params.uuid, function(err, account) {
        var oauthConfirmUrl = 'http://localhost:8080/accounts/'+account.uuid+'/setup-obc-confirm',
            obank = OpenBankService(oauthConfirmUrl, account.consumer_key, account.consumer_secret);

        obank.getTransactions(account, function(err, transactions) {
            res.json({transactions: transactions});
        });
    });
});

router.post('/accounts/:uuid/trans', function(req, res) {
    if (!req.body.device_uuid) {
        return res.status(400).json({message: "required field 'device_uuid' is missing"});
    }

    if (!req.body.amount) {
        return res.status(400).json({message: "required field 'amount' is missing"});
    }

    AccountService.findAccountByUuid(req.params.uuid, function(err, account) {
        var oauthConfirmUrl = 'http://localhost:8080/accounts/'+account.uuid+'/setup-obc-confirm',
            obank = OpenBankService(oauthConfirmUrl, account.consumer_key, account.consumer_secret);

        DeviceService.findDeviceByUuid(req.body.device_uuid, function(err, device) {
            AccountService.findAccountById(device.seller_id, function(err, seller) {
                obank.createTransaction(account, {
                    bank_id: seller.bank_id,
                    account_id: seller.account_id,
                    amount: req.body.amount
                }, function(err, banks) {
                    res.json({banks: banks});
                });
            });
        });
    });
});

router.get('/accounts/:uuid/views', function(req, res) {
    AccountService.findAccountByUuid(req.params.uuid, function(err, account) {
        var oauthConfirmUrl = 'http://localhost:8080/accounts/'+account.uuid+'/setup-obc-confirm',
            obank = OpenBankService(oauthConfirmUrl, account.consumer_key, account.consumer_secret);

        obank.getViews(account, function(err, banks) {
            res.json({banks: banks});
        });
    });
});

router.post('/devices', function(req, res) {
    if (!req.body.manager_uuid) {
        return res.status(400).json({message: "required field 'manager_uuid' is missing"});
    }

    AccountService.findAccountByUuid(req.body.manager_uuid, function(err, account) {
        DeviceService.createDevice({
            description: req.body.description,
            manager_id: account.id
        }, function(err, device) {
            res.json({device: filterDeviceFields(device)});
        });
    });
});

router.get('/devices', function(req, res) {
    DeviceService.getDevices(function(err, devices) {
        loadDevicesRelations(devices, function(err, devices) {
            res.json({devices: devices});
        });
    });
});

router.get('/devices/:uuid', function(req, res) {
    DeviceService.findDeviceByUuid(req.params.uuid, function(err, device) {
        loadDevicesRelations([device], function(err, devices) {
            res.json({device: devices[0]});
        })
    });
});

router.put('/devices/:uuid', function(req, res) {
    DeviceService.updateDeviceByUuid(req.params.uuid, req.body, function(err, device) {
        res.json({device: device});
    });
});

router.get('/transactions', function(req, res) {
    TransactionService.getTransactions(function(err, transactions) {
        loadTransactionsRelations(transactions, function(err, transactions) {
            res.json({transactions: transactions});
        })
    });
});

router.post('/transactions', function(req, res) {
    if (!req.body.device_uuid) {
        return res.status(400).json({message: "required field 'device_uuid' is missing"});
    }

    if (!req.body.amount) {
        return res.status(400).json({message: "required field 'amount' is missing"});
    }

    DeviceService.findDeviceByUuid(req.body.device_uuid, function(device) {
        TransactionService.createTransaction({
            device_id: device.id,
            amount: req.body.amount,
            status: req.body.status || TransactionService.STATUS_PENDING
        }, function(err, transaction) {
            res.json({transaction: filterTransactionFields(transaction)});
        });
    });
});

app.use('/', router);

var server = app.listen(8080);

console.log('listening on http://localhost:8080');
