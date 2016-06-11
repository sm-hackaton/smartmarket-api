var _ = require('lodash'),
    express = require('express'),
    cors = require('cors'),
    bodyParser = require('body-parser');

var DatabaseService = require('./services/DatabaseService.js'),
    AccountService = require('./services/AccountService.js'),
    DeviceService = require('./services/DeviceService.js'),
    TransactionService = require('./services/TransactionService.js');

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
    return filterFields(obj, ['id', 'password'], true);
}

function filterDeviceFields(obj) {
    return filterFields(obj, ['id'], true);
}

function filterTransactionFields(obj) {
    return filterFields(obj, ['id'], true);
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

router.get('/auth', function(req, res) {
    AccountService.authenticate(req.body.username, req.body.password, function(err, success, account) {
        if (success) {
            res.json({account: filterAccountFields(account)});
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
        res.json({accounts: filterAccountFields(accounts)});
    });
});

router.get('/accounts/:uuid', function(req, res) {
    AccountService.findAccountByUuid(req.params.uuid, function(err, account) {
        DeviceService.getDevicesWithAccountId(account.id, function(err, devices) {
            account = filterAccountFields(account);
            account.devices = filterDeviceFields(devices);
            res.json({account: account});
        });
    });
});

router.put('/accounts/:uuid', function(req, res) {
    AccountService.updateAccountByUuid(req.params.uuid, req.body, function(err, account) {
        res.json({account: filterAccountFields(account)});
    });
});

router.post('/devices', function(req, res) {
    if (!req.body.account_uuid) {
        return res.status(400).json({message: "required field 'account_uuid' is missing"});
    }

    AccountService.findAccountByUuid(req.body.account_uuid, function(err, account) {
        DeviceService.createDevice({
            description: req.body.description,
            account_id: account.id
        }, function(err, device) {
            res.json({device: filterDeviceFields(device)});
        });
    });
});

router.get('/devices', function(req, res) {
    DeviceService.getDevices(function(err, devices) {
        res.json({devices: filterDeviceFields(devices)});
    });
});

router.get('/devices/:uuid', function(req, res) {
    DeviceService.findDeviceByUuid(req.params.uuid, function(err, device) {
        AccountService.findAccountById(device.account_id, function(err, account) {
            device = filterDeviceFields(device);
            device.account = filterAccountFields(account);
            res.json({device: device});
        });
    });
});

router.put('/devices/:uuid', function(req, res) {
    DeviceService.updateDeviceByUuid(req.params.uuid, req.body, function(err, device) {
        res.json({device: filterDeviceFields(device)});
    });
});

router.get('/transactions', function(req, res) {
    TransactionService.getTransactions(function(err, transactions) {
        res.json({transactions: filterTransactionFields(transactions)});
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
