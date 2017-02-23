var logger = require('../../util/util').logger;
var pool = require('../database_connection.js').pool;
var queries = require('./pg_queries');

// register
function register(user_name, description) {
    pool.query(queries.check_user_exists, [user_name])
        .then(res => {
            if (res.rows.length == 0) {
                pool.query(queries.create_user, [user_name, description])
            } else {
                throw (new Error('User exists.'));
            }
        })
}

// TODO
// update user

// get user

module.exports = {
    register: register
}
