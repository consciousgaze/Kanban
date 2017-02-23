
// inserts
var create_board = "INSERT INTO boards(board_name, description) " +
                   "VALUES " +
                   "($1::text, $2::text) " +
                   "RETURNING board_id;";

var add_stage = "INSERT INTO stage (belonging_board_id, stage_name, stage_seq, description)" +
                "VALUES" +
                "($1::int, $2::text, $3::int, $4::text) " +
                "RETURNING stage_id;";

var add_user = "INSERT INTO personnel (board_id, user_id, rights) " +
               "VALUES " +
               "($1::int, $2::int, $3::int)";

var create_user = "INSERT INTO users (user_name, description) VALUES" +
                  "($1::text, $2::text) RETURNING user_id;"

var add_task = "INSERT INTO tasks (task_title, task_size, owner, description, task_type, " +
                  "stage_id) " +
                  "VALUES " +
                  "($1::text, $2::int, $3::int, $4::text, $5::int, $6::int) " +
                  "RETURNING task_id;";

var record_structure = "INSERT INTO projects (task_id, task_distance, decendent_task_id) " +
                       "VALUES " +
                       "($1::int, $2::int, $3::int);";

var add_edit_history = "INSERT INTO editing_history (task_id, action_id, action_target) " +
                       "VALUES " +
                       "($1::int, $2::int, $3::int);";

var add_decendent = "INSERT INTO projects (task_id, task_distance, decendent_task_id) " +
                    "VALUES " +
                    "($1::int, $2::int, $3::int);";

// selects
var get_user_id_by_name = "SELECT user_id FROM users WHERE user_name = $1::text;";

var check_user_exists = "SELECT 1 FROM users WHERE user_name = $1::int;"

var check_db_exist = "SELECT 1 FROM pg_database WHERE datname = $1::text;";

var get_task_stage = "SELECT stage_id FROM tasks WHERE task_id = $1::int;";

var get_stage_id_by_seq = "SELECT stage_id FROM stage " +
                          "WHERE belonging_board_id = $1::int and stage_seq = $2::int;";

var get_stage_id_by_task = "SELECT stage_id from tasks where task_id = $1::int;";

var get_board_id_by_stage = "SELECT belonging_board_id from stage where stage_id = $1::int;";

var get_ancestors = "SELECT task_id, task_distance FROM projects " +
                    "WHERE decendent_task_id = $1::int;";

var get_decendent = "SELECT task_distance, decendent_task_id FROME projects " +
                    "WHERE task_id = $1::int;";


// deletes
var delete_from_projects = "DELETE FROM projects WHERE " +
                           "task_id = $1::int AND " +
                           "decendent_task_id = $3::int;";

var delete_projects_by_decendent = "DELETE FROM projects WHERE decendent_task_id = $1:int";

var delete_task_by_id = "DELETE FROME tasks WHERE task_id = $1::int;";


// updates

var change_stage = "UPDATE tasks SET stage_id = $1::int WHERE task_id = $2::int;";

var update_task_title = "UPDATE tasks SET task_title = $1:text WHERE task_id = $2:int;";

var update_task_description = "UPDATE tasks SET description = $1:text WHERE task_id = $2:int;";



module.exports = {
    update_task_description: update_task_description,
    update_task_title: update_task_title,
    delete_task_by_id: delete_task_by_id,
    delete_from_projects: delete_from_projects,
    add_decendent: add_decendent,
    get_ancestors: get_ancestors,
    check_db_exist: check_db_exist,
    create_board: create_board,
    add_stage: add_stage,
    add_user: add_user,
    add_task: add_task,
    record_structure: record_structure,
    add_edit_history: add_edit_history,
    get_task_stage: get_task_stage,
    change_stage: change_stage,
    get_stage_id_by_seq: get_stage_id_by_seq,
    get_stage_id_by_task: get_stage_id_by_task,
    get_board_id_by_stage: get_board_id_by_stage,
    check_user_exists: check_user_exists,
    create_user: create_user
}
