var dbm = global.dbm || require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, next) {
    db.createTable('accounts', {
        id: {type: 'int', primaryKey: true, autoIncrement: true},
        manager_id: {
            type: 'int',
            notNull: false,
            foreignKey: {
                name: 'accounts_manager_is_fk',
                mapping: 'id',
                table: 'accounts',
                rules: {onUpdate: 'SET NULL', onDelete: 'SET NULL'}
            }
        },
        uuid: {type: 'string', unique: true},
        username: {type: 'string', unique: true},
        first_name: {type: 'string'},
        last_name: {type: 'string'},
        password: {type: 'string'},
        type: {type: 'int'},
        consumer_key: {type: 'string'},
        consumer_secret: {type: 'string'},
        req_token: {type: 'string'},
        req_secret: {type: 'string'},
        access_token: {type: 'string'},
        access_secret: {type: 'string'}
    }, next);
};

exports.down = function(db, next) {
    db.dropTable('accounts', next);
};
