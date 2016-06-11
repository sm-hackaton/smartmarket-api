var dbm = global.dbm || require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, next) {
    db.createTable('accounts', {
        id: {type: 'int', primaryKey: true, autoIncrement: true},
        uuid: {type: 'string', unique: true},
        username: {type: 'string', unique: true},
        first_name: {type: 'string'},
        last_name: {type: 'string'},
        password: {type: 'string'},
        type: {type: 'int'}
    }, next);
};

exports.down = function(db, next) {
    db.dropTable('accounts', next);
};
