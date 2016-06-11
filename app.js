var _ = require('lodash'),
    express = require('express'),
    bodyParser = require('body-parser');

function filterFields(obj, fields) {
    var isSingleObj = !Array.isArray(obj);

    if (isSingleObj) {
        obj = [obj];
    }

    var filteredObj = [];

    obj.forEach(function(elem) {
        filteredObj.push(_.pick(elem, fields));
    });

    return isSingleObj ? filteredObj[0] : filteredObj;
}

function filterAccountFields(obj) {
    return filterFields(obj, ['uuid', 'name']);
}

function filterDeviceFields(obj) {
    return filterFields(obj, ['uuid', 'description']);
}

var db = require('./services/DatabaseService.js'),
    AccountService = require('./services/AccountService.js'),
    DeviceService = require('./services/DeviceService.js');

db.connect({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS
});

process.on('exit', function() {
    console.log();
    console.log('cleanup before closing ...');
    db.end();
});

process.on('SIGINT', function() {
    process.exit();
});

var app = express(),
    router = express.Router();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// parse application/json
app.use(bodyParser.json());

router.get('/', function(req, res) {
    res.json({message: 'hey'});
});

router.post('/accounts', function(req, res) {
    AccountService.createAccount({
        name: req.body.name
    }, function(account) {
        res.json({account: filterAccountFields(account)});
    });
});

router.get('/accounts', function(req, res) {
    AccountService.getAccounts(function(accounts) {
        res.json({accounts: filterAccountFields(accounts)});
    });
});

router.get('/accounts/:uuid', function(req, res) {
    AccountService.findAccountByUuid(req.params.uuid, function(account) {
        DeviceService.getDevicesWithAccountId(account.id, function(devices) {
            account = filterAccountFields(account);
            account.devices = filterDeviceFields(devices);
            res.json({account: account});
        });
    });
});

router.put('/accounts/:uuid', function(req, res) {
    AccountService.updateAccountByUuid(req.params.uuid, req.body, function(account) {
        res.json({account: filterAccountFields(account)});
    });
});

router.post('/devices', function(req, res) {
    if (!req.body.account_uuid) {
        return res.status(400).json({message: "required field 'account_uuid' is missing"});
    }

    AccountService.findAccountByUuid(req.body.account_uuid, function(account) {
        DeviceService.createDevice({
            description: req.body.description,
            account_id: account.id
        }, function(device) {
            res.json({device: filterDeviceFields(device)});
        });
    });
});

router.get('/devices', function(req, res) {
    DeviceService.getDevices(function(devices) {
        res.json({devices: filterDeviceFields(devices)});
    });
});

router.get('/devices/:uuid', function(req, res) {
    DeviceService.findDeviceByUuid(req.params.uuid, function(device) {
        AccountService.findAccountById(device.account_id, function(account) {
            device = filterDeviceFields(device);
            device.account = filterAccountFields(account);
            res.json({device: device});
        });
    });
});

router.put('/devices/:uuid', function(req, res) {
    DeviceService.updateDeviceByUuid(req.params.uuid, req.body, function(device) {
        res.json({device: filterDeviceFields(device)});
    });
});

app.use('/', router);

var server = app.listen(8080);

console.log('listening on http://localhost:8080');
