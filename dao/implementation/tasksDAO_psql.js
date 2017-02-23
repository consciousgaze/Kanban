var pool = require('../database_connection').pool;
var board = require('./boardDAO_psql.js');
var queries = require('./pg_queries');
var async = require('async');

// create task
function create_task(ancestor, title, description, size, user_id, task_type) {
    // get stage_id of ancestor task
    pool.query(queries.get_stage_id_by_task, [ancestor])
        // get board_id from stage_id
        .then(res => {
              if (res.rows.length == 0) {
                logger.log('error', 'Task does not exist.');
                throw (new Error("Task does not exist."));
              }
              var stage_id = res.rows[0]['stage_id'];
              pool.query(queries.get_board_id_by_stage, [stage_id])
                  // get todo stage id of the board
                  .then(res => {
                        var board_id = res.rows[0]['belonging_board_id'];
                        pool.query(queries.get_stage_id_by_seq, [board_id, 0])
                            // create the task and get the task_id
                            .then(res => {
                                  var todo_id = res.rows[0]['stage_id'];
                                  pool.query(queries.add_task,
                                             [title, size, user_id,
                                              description, task_type, todo_id, 1])
                                      // put the task into project tree
                                      .then(res => {
                                            var task_id = res.rows[0]['task_id'];
                                            // record editing history
                                            pool.query(queries.add_edit_history, [task_id, 3, ancestor]);
                                            // put the task to project closure table
                                            pool.query(queries.record_structure, [task_id, 0, task_id]);
                                            // get all ancestors
                                            pool.query(queries.get_ancestors, [ancestor])
                                                // add task as a decendent of all its ancestors
                                                .then(res => {
                                                      var anc_num = res.rows.length;
                                                      for (i = 0; i < anc_num; i ++) {
                                                          var ancestor_id = res.rows[i]['task_id'];
                                                          var depth = res.rows[i]['task_distance'] + 1;
                                                          pool.query(queries.add_decendent,
                                                                     [ancestor_id, depth, task_id]);
                                                          // update the leaf/root status
                                                          pool.query(queries.check_task_is_leaf_by_id, [ancestor_id])
                                                              .then( res => {
                                                                     var root_or_leaf = res.rows[0]['root_or_leaf'];
                                                                     if (root_or_leaf == 2) {
                                                                         root_or_leaf = 0;
                                                                     } else if (root_or_leaf == 1) {
                                                                         root_or_leaf = -1;
                                                                     }
                                                                     pool.query(queries.update_leaf_state,
                                                                                [root_or_leaf, ancestor_id]);
                                                                   })

                                                      }
                                                      })
                                            })
                               })

                      })
         })
}

// move task
function move_task(src, dst, task_id) {
    // TODO: ensure that projects are tree structures
    async.series([ function() {
                    // remove task from all its current ancestors
                    pool.query(queries.get_ancestors, [task_id])
                        .then(res => {
                            var count = res.rows.length;
                            for (i = 0; i < count; i ++) {
                                var anc_id = res.rows[i]['task_id'];
                                var depth = res.rows[i]['task_distance'];
                                if (anc_id != task_id) {
                                    pool.query(queries.delete_from_projects, [anc_id, task_id]);
                                        .then(function(){
                                        })
                                }
                            }
                        });
                    },
                    function() {
                        // add task as a sub task of dst task
                        pool.query(queries.get_ancestors, [dst])
                            .then(res => {
                                var count = res.rows.length;
                                for (i = 0; i < count; i ++) {
                                    var anc_id = res.rows[i]['task_id'];
                                    var depth = res.rows[i]['task_distance'] + 1;
                                    // add task_id as a decedent
                                    pool.query(queries.add_decendent, [anc_id, depth, task_id]);
                                }
                            })
                    }])
}

// delete task, which means all its decedents
function delete_task(task_id) {
    pool.query(queries.get_decendent, [task_id])
        .then(res => {
            var count = res.rows.length;
            for (i = 0; i < count; i ++) {
                var dec_id = res.rows[i]['task_id']
                query(queries.delete_projects_by_decendent, [dec_id]);
            }
        })
}

// update task title
function update_task_title(task_id, title) {
    pool.query(queries.update_task_title, [title, task_id]);
}

// update task description
function update_task_description(task_id, description) {
    pool.query(queries.update_task_description, [description, task_id]);
}

// TODO:
// update task tag

// update task type

// attach files to task

module.exports = {
    create_task: create_task,
    move_task: move_task,
    delete_task: delete_task,
    update_task_title: update_task_title,
    update_task_description: update_task_description
}
