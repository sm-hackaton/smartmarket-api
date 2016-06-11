var _ = require('lodash'),
    db = require('./DatabaseService.js'),
    uuid = require('uuid');

var DeviceService = {
    findDeviceById: function(id, next) {
        db.query('select * from devices where id = ?', [id], function(err, rows) {
            if (err) throw err;
            next(null, rows.length && rows[0] || null);
        });
    },
    findDeviceByUuid: function(uuid, next) {
        db.query('select * from devices where uuid = ?', [uuid], function(err, rows) {
            if (err) throw err;
            next(null, rows.length && rows[0] || null);
        });
    },
    getDevices: function(next) {
        db.query('select * from devices', function(err, rows) {
            if (err) throw err;
            next(null, rows);
        });
    },
    getDevicesWithAccountId: function(accountId, next) {
        db.query('select * from devices where account_id = ?', [accountId], function(err, rows) {
            if (err) throw err;
            next(null, rows);
        });
    },
    createDevice: function(fields, next) {
        db.query('insert into devices set ?', {
            uuid: uuid.v4(),
            description: fields.description,
            account_id: fields.account_id
        }, function(err, result) {
            if (err) throw err;
            DeviceService.findDeviceById(result.insertId, next);
        });
    },
    updateDeviceById: function(id, fields, next) {
        var fieldsToUpdate = _.pick(fields, ['description']);

        db.query('update devices set ? where id = '+id, fieldsToUpdate, function(err, result) {
            if (err) throw err;
            DeviceService.findAccountById(id, next);
        });
    },
    updateDeviceByUuid: function(uuid, fields, next) {
        DeviceService.findDeviceByUuid(uuid, function(err, device) {
            DeviceService.updateDeviceById(device.id, fields, next);
        });
    }
};

module.exports = DeviceService;
