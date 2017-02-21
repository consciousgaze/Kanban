/*
    This script set kanban host up.
    It creates local database
*/

var config = require('../conf/config');
var pg = require('pg');

var db_config = config.db_config;

if (config.test) {
    var db_name = config.devl_db;
} else {
    var db_name = config.prod_db;
}

db_config.database = 'postgres';

var pool = new pg.Pool(db_config);

db_config.database = db_name

pool.query("SELECT 1 FROM pg_database WHERE datname='" + db_name + "';", [])
    .then(res => create_database(res.rows.length != 0))

pool.on('error', function (err, client) {
  console.error('idle client error', err.message, err.stack)
});



// aux functions
function create_database(exist) {
    if (!exist) {
        pool.query('CREATE DATABASE "' + db_name + '" OWNER "' + db_config.user + '";', [])
            .then(res => create_tables(db_config));
    } else {
        create_tables(db_config);
    }
}


function create_tables(db_config) {
    //    users:
    //        list all users
    //        C: user_id, user_name, description
    var create_user_table = "CREATE TABLE IF NOT EXISTS users (\n" +
                            "user_id SERIAL,\n" +
                            "user_name text,\n" +
                            "description text,\n" +
                            "PRIMARY KEY(user_id));";

    //    boards:
    //        list all boards
    //        C: baord_id, board_name, description
    var create_boards_table = "CREATE TABLE IF NOT EXISTS boards (\n" +
                              "board_id SERIAL,\n" +
                              "board_name text,\n" +
                              "description text,\n" +
                              "PRIMARY KEY(board_id));";

    //    personnel:
    //        show the contributing boards of users
    //        C: board_id, user_id, rights
    var create_personnel_table = "CREATE TABLE IF NOT EXISTS personnel (\n" +
                                 "board_id integer,\n" +
                                 "user_id integer,\n" +
                                 "rights integer,\n" +
                                 "PRIMARY KEY(board_id, user_id));";

    //    stages:
    //        shows the stages of each board, stage "todo" of stage_seq 0 and stage "null" of stage_seq
    //        -1 are required for each board. Stage name can be arbitraritly changed.
    //        C: stage_id, belonging_board_id, stage_name, stage_seq, stage_description
    var create_stage_table = "CREATE TABLE IF NOT EXISTS stage (\n" +
                             "stage_id SERIAL,\n" +
                             "belonging_board_id integer,\n" +
                             "stage_name varchar(50),\n" +
                             "stage_seq integer,\n" +
                             "description text,\n" +
                             "PRIMARY KEY(stage_id));";

    //    tasks:
    //        shows all the tasks, explains the descriptions, task size, types etc.
    //        C: task_id, task_title, task_size, owner, task_description, task_type, stage_id
    var create_tasks_table = "CREATE TABLE IF NOT EXISTS tasks (\n" +
                             "task_id SERIAL,\n" +
                             "task_title text,\n" +
                             "task_size integer,\n" +
                             "owner integer,\n" +
                             "description text,\n" +
                             "task_type integer,\n" +
                             "stage_id integer,\n" +
                             "PRIMARY KEY(task_id));";

    //    task_types:
    //        shows all task types including project root, module, feature and task.
    //        this can be declared as enum type, but we do not want to rely on db functionalities
    //        C: task_type_id, task_type_name
    var create_task_type_table = "CREATE TABLE IF NOT EXISTS task_type (\n" +
                                 "task_type_id SERIAL,\n" +
                                 "task_type_name text,\n" +
                                 "PRIMARY KEY(task_type_id));";

    //    tags:
    //        shows all tags that has been created
    //        C: tag_id, tag_name
    var create_tags = "CREATE TABLE IF NOT EXISTS tags (\n" +
                      "tag_id SERIAL,\n" +
                      "tag_name text,\n" +
                      "PRIMARY KEY(tag_id));";

    //    task_tags:
    //        shows task tags
    //        C: task_id, tag_id
    var create_task_tags = "CREATE TABLE IF NOT EXISTS task_tags (\n" +
                           "task_id integer,\n" +
                           "tag_id integer,\n" +
                           "PRIMARY KEY(task_id, tag_id));";

    //    projects:
    //        shows the tasks relationships between each other. It is basically a closure table
    //        that shows tree strucutre of each project which is a tree of tasks.
    //        The column "belonging_board_id" will be null unless the task is the root task of a
    //        project.
    //        C: task_id, task_distance, decendent_task_id
    var create_project_table = "CREATE TABLE IF NOT EXISTS projects (\n" +
                               "task_id integer,\n" +
                               "task_distance integer,\n" +
                               "decendent_task_id integer,\n" +
                               "is_root boolean,\n" +
                               "PRIMARY KEY(task_id, decendent_task_id));";

    //    actions:
    //        shows all possible actions
    //        C: action_id, action_name, action_description
    var create_action_table = "CREATE TABLE IF NOT EXISTS action (\n" +
                              "action_id SERIAL,\n" +
                              "action_name varchar(50),\n" +
                              "description text,\n" +
                              "PRIMARY KEY(action_id));";

    //    editing_history:
    //        show progressing operations on tasks, i.e., adding/removing sub task, changing stage,
    //        moving task etc.
    //        C: timestamp, task_id, action_id, action_target
    var create_edit_history = "CREATE TABLE IF NOT EXISTS editing_history (\n" +
                              "time_stamp timestamp,\n" +
                              "task_id integer,\n" +
                              "action_id integer,\n" +
                              "action_target integer,\n" +
                              "PRIMARY KEY(time_stamp, task_id, action_id, action_target));";

    //    comments:
    //        show comments on tasks
    //        C: comments, task_id, time_stamp, comments
    var create_comments_table = "CREATE TABLE IF NOT EXISTS comments (\n" +
                                "comment_id SERIAL,\n" +
                                "task_id integer,\n" +
                                "time_stamp timestamp,\n" +
                                "comments text,\n" +
                                "PRIMARY KEY(comment_id));";

    var pool = new pg.Pool(db_config);
    pool.query(create_user_table, []);
    pool.query(create_boards_table, []);
    pool.query(create_personnel_table, []);
    pool.query(create_stage_table, []);
    pool.query(create_tasks_table, []);
    pool.query(create_task_type_table, []);
    pool.query(create_tags, []);
    pool.query(create_task_tags, []);
    pool.query(create_project_table, []);
    pool.query(create_action_table, []);
    pool.query(create_edit_history, []);
    pool.query(create_comments_table, []);
    pool.on('error', function (err) {throw (err)});
}
