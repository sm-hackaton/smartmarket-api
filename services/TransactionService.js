var _ = require('lodash'),
    uuid = require('uuid'),
    db = require('./DatabaseService.js');

var TransactionService = {
    findTransactionById: function(id, next) {
        db.query('select * from transactions where id = ?', [id], function(err, rows) {
            if (err) throw err;
            next(null, rows.length && rows[0] || null);
        });
    },
    findTransactionByUuid: function(uuid, next) {
        db.query('select * from transactions where uuid = ?', [uuid], function(err, rows) {
            if (err) throw err;
            next(null, rows.length && rows[0] || null);
        });
    },
    getTransactions: function(next) {
        db.query('select * from transactions', function(err, rows) {
            if (err) throw err;
            next(null, rows);
        });
    },
    createTransaction: function(fields, next) {
        db.query('insert into transactions set ?', {
            uuid: uuid.v4(),
            device_id: fields.device_id,
            amount: fields.amount,
            status: fields.status
        }, function(err, result) {
            if (err) throw err;
            TransactionService.findTransactionById(result.insertId, next);
        });
    },
    updateTransactionById: function(id, fields, next) {
        var fieldsToUpdate = _.pick(fields, ['name']);

        db.query('update transactions set ? where id = '+id, fieldsToUpdate, function(err, result) {
            if (err) throw err;
            TransactionService.findTransactionById(id, next);
        });
    },
    updateTransactionByUuid: function(uuid, fields, next) {
        TransactionService.findTransactionByUuid(uuid, function(err, account) {
            TransactionService.updateTransactionById(account.id, fields, next);
        });
    }
};

TransactionService.STATUS_PENDING = 1;

TransactionService.STATUS_ACCEPTED = 2;

TransactionService.STATUS_REJECTED = 3;

module.exports = TransactionService;
