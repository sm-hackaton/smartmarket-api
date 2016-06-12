var dbm = global.dbm || require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, next) {
    db.createTable('devices', {
        id: {type: 'int', primaryKey: true, autoIncrement: true},
        uuid: {type: 'string', unique: true},
        manager_id: {
            type: 'int',
            foreignKey: {
                name: 'devices_manager_id_fk',
                mapping: 'id',
                table: 'accounts',
                rules: {onUpdate: 'CASCADE', onDelete: 'CASCADE'}
            }
        },
        seller_id: {
            type: 'int',
            notNull: false,
            foreignKey: {
                name: 'devices_seller_id_fk',
                mapping: 'id',
                table: 'accounts',
                rules: {onUpdate: 'CASCADE', onDelete: 'CASCADE'}
            }
        },
        description: {type: 'string', notNull: false}
    }, next);
};

exports.down = function(db, next) {
    db.dropTable('devices', next);
};
