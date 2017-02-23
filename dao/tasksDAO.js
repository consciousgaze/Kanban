var config = require('../conf/config');
var pg_task_dao = require('./implementation/tasksDAO_psql.js');

// export proper api according to config
switch (config.database) {
    case 'postgres':
        task_dao = pg_task_dao;
        break;
    default:
        throw (new TypeError("Tasks in " + config.database + " is not supported yet."));
}

module.exports = {
    create_task: task_dao.create_task,
    move_task: task_dao.move_task,
    delete_task: task_dao.delete_task,
    update_task_title: task_dao.update_task_title,
    update_task_description: task_dao.update_task_description
}
