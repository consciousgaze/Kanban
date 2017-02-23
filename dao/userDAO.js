var config = require('../conf/config');
var pg_user_dao = require('./implementation/userDAO_psql.js');

// export proper api according to config
switch (config.database) {
    case 'postgres':
        user_dao = pg_user_dao;
        break;
    default:
        throw (new TypeError("Users in " + config.database + " is not supported yet."));
}

module.exports = {
    register: user_dao.register
}
