var config = require('../conf/config');
var pg_board_dao = require('./implementation/boardDAO_psql.js');

var create_new_board;
var add_new_stage;
var add_new_user;
var add_new_project;
var move_task;

// export proper api according to config
switch (config.database) {
    case 'postgres':
        board_dao = pg_board_dao;
        break;
    default:
        throw (new TypeError("Boards in " + config.database + " is not supported yet."));
}

module.exports = {
    create_new_board: board_dao.create_new_board,
    add_new_stage: board_dao.add_new_stage,
    add_new_user: board_dao.add_new_user,
    create_new_project: board_dao.create_new_project,
    move_task: board_dao.move_task
}
