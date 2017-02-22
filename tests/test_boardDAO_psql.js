var create = require('../dao/implementation/boardDao_psql').create_new_board;
var add_user = require('../dao/implementation/boardDao_psql').add_new_user;
var add_project = require('../dao/implementation/boardDao_psql').add_new_project;
var move_task = require('../dao/implementation/boardDao_psql').move_task;
create('test_board', 'test board that will be deleted later', '1');
add_user(1, 1, 0);
add_project("test_project", 3, 1, "test project");
//move_task()
