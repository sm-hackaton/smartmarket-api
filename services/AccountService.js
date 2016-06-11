var _ = require('lodash'),
    uuid = require('uuid'),
    db = require('./DatabaseService.js');

module.exports = {
    findAccountById: function(id, next) {
        db.query('select * from accounts where id = ?', [id], function(err, rows) {
            if (err) throw err;
            next(rows.length && rows[0] || null);
        });
    },
    findAccountByUuid: function(uuid, next) {
        db.query('select * from accounts where uuid = ?', [uuid], function(err, rows) {
            if (err) throw err;
            next(rows.length && rows[0] || null);
        });
    },
    getAccounts: function(next) {
        db.query('select * from accounts', function(err, rows) {
            if (err) throw err;
            next(rows);
        });
    },
    createAccount: function(fields, next) {
        db.query('insert into accounts set ?', {
            uuid: uuid.v4(),
            name: fields.name
        }, function(err, result) {
            if (err) throw err;
            module.exports.findAccountById(result.insertId, next);
        });
    },
    updateAccountById: function(id, fields, next) {
        var fieldsToUpdate = _.pick(fields, ['name']);

        db.query('update accounts set ? where id = '+id, fieldsToUpdate, function(err, result) {
            if (err) throw err;
            module.exports.findAccountById(id, next);
        });
    },
    updateAccountByUuid: function(uuid, fields, next) {
        module.exports.findAccountByUuid(uuid, function(account) {
            module.exports.updateAccountById(account.id, fields, next);
        });
    }
};
