var mysql = require('mysql');

var db = null;

module.exports = {
    connect: function(opts) {
        if (!opts.host) {
            throw new Error("required 'host' property is missing");
        }

        if (!opts.database) {
            throw new Error("required 'database' property is missing");
        }

        if (!opts.user) {
            throw new Error("required 'user' property is missing");
        }

        if (!opts.password) {
            throw new Error("required 'password' property is missing");
        }

        db = mysql.createConnection(opts);
    },
    query: function() {
        return db.query.apply(db, arguments);
    },
    end: function() {
        return db.end.apply(db, arguments);
    }
};
