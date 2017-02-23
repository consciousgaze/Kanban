var config = require('../conf/config');
var pg = require("pg");
var logger = require('../util/util').logger;

// initilize postgres database
var queries = require('./implementation/pg_queries');

function pg_init_database() {
    var postgres_config = config.db_config;
    var kanban_config = config.db_config;

    postgres_config.database = 'postgres';

    var postgres_pool = new pg.Pool(postgres_config);

    if (config.test) {
        kanban_config.database = config.devl_db;
    } else {
        kanban_config.database = config.prod_db;
    }
    console.log(queries.check_db_exist);
    postgres_pool.query(queries.check_db_exist, [kanban_config.database])
                 .then(res => {
                               pg_create_database(postgres_pool,
                                                  kanban_config,
                                                  res.rows.length != 0)
                              }
                      );

}

function pg_create_database(postgres_pool, kanban_config, exist) {
    logger.log("info", kanban_config);
    if (!exist) {
        logger.log("info", kanban_config.database + " does not exist, creating.");
        //postgres_pool.query(queries.create_db_with_owner, [kanban_config.database, kanban_config.user])
        postgres_pool.query('CREATE DATABASE "' + kanban_config.database + '" OWNER ' +
                            kanban_config.user + ";")
                     .then(res => {
                                    logger.log("info", kanban_config.database + " created.")
                                    var kanban_pool = new pg.Pool(kanban_config)
                                    pg_create_tables(kanban_pool)
                                  });
    } else {
        var kanban_pool = new pg.Pool(kanban_config)
        pg_create_tables(kanban_pool);
    }
}

function pg_create_tables(kanban_pool) {
    logger.log("info", "Creating tables.");
    //    users:
    //        list all users
    //        C: user_id, user_name, description
    var create_user_table = "CREATE TABLE IF NOT EXISTS users (\n" +
                            "user_id SERIAL,\n" +
                            "user_name text,\n" +
                            "description text,\n" +
                            "PRIMARY KEY(user_name));";

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
    //        C: task_id, task_title, task_size, owner, task_description, task_type, stage_id, root_or_leaf
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
    //        C: task_id, task_distance, is_root, decendent_task_id
    var create_project_table = "CREATE TABLE IF NOT EXISTS projects (\n" +
                               "task_id integer,\n" +
                               "task_distance integer,\n" +
                               "decendent_task_id integer,\n" +
                               "PRIMARY KEY(task_id, decendent_task_id));";

    //    actions:
    //        shows all possible actions
    //        C: action_id, action_name, action_description
    var create_action_table = "CREATE TABLE IF NOT EXISTS action (\n" +
                              "action_id SERIAL,\n" +
                              "action_name varchar(50),\n" +
                              "description text,\n" +
                              "PRIMARY KEY(action_id));";

    // add actions upon setting up
    var add_actions = "INSERT INTO action (action_id, action_name, description)" +
                      "VALUES" +
                      "(0, 'create project', 'create a project')," +
                      "(1, 'move stage', 'move a task to a new stage')," +
                      "(2, 'move task', 'move a task to a different parent task')," +
                      "(3, 'create task', 'create a new task as sub-task of an exisiting task')," +
                      "(4, 'tag task', 'tag a task')," +
                      "(5, 'change task type', 'change the type of a task');";

    //    editing_history:
    //        show progressing operations on tasks, i.e., adding/removing sub task, changing stage,
    //        moving task etc.
    //        C: timestamp, task_id, action_id, action_target
    var create_edit_history = "CREATE TABLE IF NOT EXISTS editing_history (\n" +
                              "time_stamp timestamp DEFAULT NOW(),\n" +
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

    kanban_pool.query(create_user_table, []);
    kanban_pool.query(create_boards_table, []);
    kanban_pool.query(create_personnel_table, []);
    kanban_pool.query(create_stage_table, []);
    kanban_pool.query(create_tasks_table, []);
    kanban_pool.query(create_task_type_table, []);
    kanban_pool.query(create_tags, []);
    kanban_pool.query(create_task_tags, []);
    kanban_pool.query(create_project_table, []);
    kanban_pool.query(create_action_table, [])
               .then(res => kanban_pool.query(add_actions, []))
               .catch(e => {
                            if (e['code'] != 23505) {
                                logger.log('error', e.stack);
                                throw (e);
                            }
                           }
               );
    kanban_pool.query(create_edit_history, []);
    kanban_pool.query(create_comments_table, []);
    kanban_pool.on('error', function (err) {throw (err)});
}

function pg_pool() {
    var kanban_config = config.db_config;
    if (config.test) {
        kanban_config.database = config.devl_db;
    } else {
        kanban_config.database = config.prod_db;
    }
    var pool = new pg.Pool(kanban_config);
    pool.on('error', function (err) {throw (err)});
    return pool;
}

function Pg_Pool() {
    this.config = config.db_config;
    if (config.test) {
        this.config.database = config.devl_db;
    } else {
        this.config.database = config.prod_db;
    }
    this.pool = null;
}

Pg_Pool.prototype.init = function(query, list) {
    this.pool = new pg.Pool(this.config);
    this.pool.on('error', function(err) {throw (err)});
    this.query = function(query, list) {
        return this.pool.query(query, list);
    }
    return this.query(query, list);
}

Pg_Pool.prototype.query = function(query, list) {
    return this.init(query, list);
}

switch (config.database) {
    case 'postgres':
        var pool = new Pg_Pool();
        var database_init = pg_init_database;
        break;
    default:
        throw (new TypeError("Database " + config.database + " is not supported yet."));
}

module.exports = {
    pool: pool,
    database_init: database_init
}
