var logger = require('../../util/util').logger;
//var winston = require('winston');
var Pool = require('../database_connection.js').Pool;

function create_new_board(board_name, board_description, user_id) {
    var pool = Pool();
    var create_board = "INSERT INTO boards(board_name, description) " +
                       "VALUES " +
                       "('" + board_name + "', '" + board_description + "') " +
                       "RETURNING board_id;";
    // rights are not fully used for now, 0 means the creator 
    // while 1 means other user in board
    pool.query(create_board, [])
        .then(res => {board_id = res.rows[0]['board_id']
                      logger.log("info", "User " + user_id + " created board " + board_id)
                      var assign_user = "INSERT INTO personnel(board_id, user_id, rights) " +
                                        "VALUES " +
                                        "(" + board_id + ", " + user_id + ", 0" + ");"
                      pool.query(assign_user, [])
                          .then(res => logger.log("info", "User " + user_id + 
                                                  " assigned as the owner of board " + board_id))
                      add_new_stage(board_id, "Todo", 0, "default TODO stage")
                      add_new_stage(board_id, "noncards", -1, "default stage that stores all " +
                                                              "non-card tasks which is not visible " +
                                                              "to users")
                     }
             );
}

function add_new_stage(board_id, stage_name, stage_seq, description) {
    var pool = Pool();
    var add_stage = "INSERT INTO stage (belonging_board_id, stage_name, stage_seq, description)" +
                    "VALUES" +
                    "(" + board_id + ", '" + stage_name + "', " + stage_seq + ",'" + description + "')" +
                    "RETURNING stage_id;";
    pool.query(add_stage, [])
        .then(res => {
                      logger.log("info", "Stage " + stage_name + " added to board " + board_id +
                                 " with stage id of " + res.rows[0]['stage_id'])

                     }
             );
}

function add_new_user(board_id, user_id, rights) {
    var pool = Pool();
    var add_user = "INSERT INTO personnel (board_id, user_id, rights)" +
                   "VALUES" +
                   "(" + board_id + ", " + user_id + ", " + rights +")";
    pool.query(add_user, [])
        .then(res => logger.log("info", "User " + user_id + " is assigned to board " +
                                board_id + " with right of " + rights));
}

function add_new_project(title, size, user_id, description) {
    var pool = Pool();
    // task type is 0, which means project, stage is 0 since it is a leaf task upon creation
    var add_project = "INSERT INTO tasks (task_title, task_size, owner, description, task_type, " +
                      "stage_id)" +
                      "VALUES" +
                      "('" + title + "', " + size + ", " + user_id + ", '" + description + "', 0, 0) " +
                      "RETURNING task_id;";

    pool.query(add_project, [])
        .then(res => {
                      task_id = res.rows[0]['task_id']
                      var record_structure = "INSERT INTO projects (task_id, task_distance, is_root, " +
                                             "decendent_task_id)" +
                                             "VALUES" +
                                             "(" + task_id + ", 0, true, " + task_id + ");";
                      pool.query(record_structure, [])
                          .then(res => {
                                        logger.log("info", 'Project ' + task_id +
                                                   " has been created by user " + user_id)
                                        pool.query("INSERT INTO editing_history " +
                                                   "(task_id, action_id, action_target) VALUES " +
                                                   "(" + task_id + ", 0, " + task_id + ");")
                                        }
                                )
                     }
             );

}

function move_task(task_id, target_state) {
    var pool = Pool();
    var get_task_stage = "SELECT stage_id from tasks where task_id == " + task_id + ";";
    pool.query(get_task_stage, [])
        .then(res => {
                        var stage_id = res.rows[0]['task_id']
                        var change_stage = "UPDATE tasks SET stage_id = " + target_state +
                                           ", WHERE task_id == " + task_id + ";";
                        pool.query(change_stage, [])
                            .then(res => logger.log("info", "Task" + task_id + " has been " +
                                                            "moved from stage " + stage_id +
                                                            " to stage " + target_state))
                        pool.query("INSERT INTO editing_history " +
                                   "(task_id, action_id, action_target) VALUES " +
                                   "(" + task_id + ", 1, " + target_state + ");")
                     }
             )
}

module.exports = {
    create_new_board: create_new_board,
    add_new_stage: add_new_stage,
    add_new_user: add_new_user,
    add_new_project: add_new_project,
    move_task: move_task
}
