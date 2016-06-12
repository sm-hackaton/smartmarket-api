var _ = require('lodash'),
    uuid = require('uuid'),
    bcrypt = require('bcrypt'),
    db = require('./DatabaseService.js');

var AccountService = {
    authenticate: function(username, password, next) {
        AccountService.findAccountByUsername(username, function(err, account) {
            if (!account) {
                return next(null, false);
            }

            bcrypt.compare(password, account.password, function(err, doesMatch) {
                next(null, doesMatch, doesMatch && account);
            });
        });
    },
    findAccountById: function(id, next) {
        db.query('select * from accounts where id = ?', [id], function(err, rows) {
            if (err) throw err;
            next(null, rows.length && rows[0] || null);
        });
    },
    findAccountByUuid: function(uuid, next) {
        db.query('select * from accounts where uuid = ?', [uuid], function(err, rows) {
            if (err) throw err;
            next(null, rows.length && rows[0] || null);
        });
    },
    findAccountByUsername: function(username, next) {
        db.query('select * from accounts where username = ?', [username], function(err, rows) {
            if (err) throw err;
            next(null, rows.length && rows[0] || null);
        });
    },
    getAccounts: function(next) {
        db.query('select * from accounts', function(err, rows) {
            if (err) throw err;
            next(null, rows);
        });
    },
    createAccount: function(fields, next) {
        bcrypt.hash(fields.password, 10, function(err, hash) {
            db.query('insert into accounts set ?', {
                uuid: uuid.v4(),
                username: fields.username,
                first_name: fields.first_name,
                last_name: fields.last_name,
                password: hash
            }, function(err, result) {
                if (err) throw err;
                AccountService.findAccountById(result.insertId, function(err, account) {
                    next && next(null, account);
                });
            });
        });
    },
    updateAccountById: function(id, fields, next) {
        var fieldsToUpdate = _.pick(fields, ['name']);

        db.query('update accounts set ? where id = '+id, fieldsToUpdate, function(err, result) {
            if (err) throw err;
            AccountService.findAccountById(id, next);
        });
    },
    updateAccountByUuid: function(uuid, fields, next) {
        AccountService.findAccountByUuid(uuid, function(err, account) {
            AccountService.updateAccountById(account.id, fields, next);
        });
    }
};

module.exports = AccountService;
