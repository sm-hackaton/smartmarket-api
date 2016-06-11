var dbm = global.dbm || require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, next) {
    db.createTable('transactions', {
        id: {type: 'int', primaryKey: true, autoIncrement: true},
        uuid: {type: 'string', unique: true},
        amount: {type: 'decimal', length: '19,3'},
        device_id: {
            type: 'int',
            foreignKey: {
                name: 'transactions_device_id_fk',
                mapping: 'id',
                table: 'devices',
                rules: {onUpdate: 'CASCADE', onDelete: 'CASCADE'}
            }
        },
        status: {type: 'int'}
    }, next);
};

exports.down = function(db, next) {
    db.dropTable('transactions', next);
};
