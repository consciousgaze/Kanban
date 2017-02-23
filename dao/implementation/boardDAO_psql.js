var logger = require('../../util/util').logger;
var pool = require('../database_connection.js').pool;
var queries = require('./pg_queries');

function create_new_board(board_name, board_description, user_id) {
    // rights are not fully used for now, 0 means the creator 
    // while 1 means other user in board
    pool.query(queries.create_board, [board_name, board_description])
        .then(res => {board_id = res.rows[0]['board_id']
                      logger.log("info", "User " + user_id + " created board " + board_id)
                      add_new_user(board_id, user_id, 0)
                      add_new_stage(board_id, "Todo", 0, "default TODO stage")
                      add_new_stage(board_id, "noncards", -1, "default stage that stores all " +
                                                              "non-card tasks which is not visible " +
                                                              "to users")
                     }
             );
}

function add_new_stage(board_id, stage_name, stage_seq, description) {
    pool.query(queries.add_stage, [board_id, stage_name, stage_seq, description])
        .then(res => {
                      logger.log("info", "Stage " + stage_name + " added to board " + board_id +
                                 " with stage id of " + res.rows[0]['stage_id'])

                     }
             );
}

function add_new_user(board_id, user_id, rights) {
    pool.query(queries.add_user, [board_id, user_id, rights])
        .then(res => logger.log("info", "User " + user_id + " is assigned to board " +
                                board_id + " with right of " + rights))
        .catch(e => {
                    if (e['code'] != 23505) {
                        logger.log('error', e.stack);
                        throw (e);
                    }
                    }
              );
}


function add_new_project(title, size, user_id, description, board_id) {
    // task type is 0, which means project, stage is 0 since it is a leaf task upon creation
    pool.query(queries.get_stage_id_by_seq, [board_id, 0])
        .then( res => {
                        var stage_id = res.rows[0]['stage_id']
                        pool.query(queries.add_task, [title, size, user_id, description, 0, stage_id])
                            .then(res => {
                                          task_id = res.rows[0]['task_id']
                                          pool.query(queries.record_structure, [task_id, 0, task_id])
                                              .then(res => {
                                                            logger.log("info", 'Project ' + task_id +
                                                                       " has been created by user " + user_id)
                                                            pool.query(queries.add_edit_history,
                                                                       [task_id, 0, task_id])
                                                           }
                                                   )

                                         }
                                 )
                      }
             );
}

function move_task(task_id, target_state) {
    pool.query(queries.get_task_stage, [task_id])
        .then(res => {
                        var stage_id = res.rows[0]['task_id']
                        pool.query(queries.change_stage, [target_state, task_id])
                            .then(res => logger.log("info", "Task" + task_id + " has been " +
                                                            "moved from stage " + stage_id +
                                                            " to stage " + target_state))
                        pool.query(queries.add_edit_history, [task_id, 1, target_state]);
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
