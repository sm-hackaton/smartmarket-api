var _ = require('lodash'),
    db = require('./DatabaseService.js'),
    uuid = require('uuid');

module.exports = {
    findDeviceById: function(id, next) {
        db.query('select * from devices where id = ?', [id], function(err, rows) {
            if (err) throw err;
            next(rows.length && rows[0] || null);
        });
    },
    findDeviceByUuid: function(uuid, next) {
        db.query('select * from devices where uuid = ?', [uuid], function(err, rows) {
            if (err) throw err;
            next(rows.length && rows[0] || null);
        });
    },
    getDevices: function(next) {
        db.query('select * from devices', function(err, rows) {
            if (err) throw err;
            next(rows);
        });
    },
    getDevicesWithAccountId: function(accountId, next) {
        db.query('select * from devices where account_id = ?', [accountId], function(err, rows) {
            if (err) throw err;
            next(rows);
        });
    },
    createDevice: function(fields, next) {
        db.query('insert into devices set ?', {
            uuid: uuid.v4(),
            description: fields.description,
            account_id: fields.account_id
        }, function(err, result) {
            if (err) throw err;
            module.exports.findDeviceById(result.insertId, next);
        });
    },
    updateDeviceById: function(id, fields, next) {
        var fieldsToUpdate = _.pick(fields, ['description']);

        db.query('update devices set ? where id = '+id, fieldsToUpdate, function(err, result) {
            if (err) throw err;
            module.exports.findAccountById(id, next);
        });
    },
    updateDeviceByUuid: function(uuid, fields, next) {
        module.exports.findDeviceByUuid(uuid, function(device) {
            module.exports.updateDeviceById(device.id, fields, next);
        });
    }
};
