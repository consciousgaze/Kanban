# Kanban Webapp
This is a simple Kanban webapp build with nodejs.

# Use Cases
A user can register himself

A user can be added to a board

A user can create a board

A user can create a project, adding new task/modules/features etc to an exising project

A user can modify a existing task and adding sub tasks to it.

A user can create tags and attach tags to tasks

A user can create task types and set a task to certain type

A user can move a card, which is a leaf task, to the next stage.

A user can retrive the working history on a task

A user can comment on any task

A user can generate burnout diagram on any task/project

A user can move a task between projects or change the parent task of a task

A user can attach/remove files to a task.

# Model
board - cards - projects - modules - features - tasks

A board is a dispalying board that contains several stages: todo, design, implementation, verifying, done etc.

A card is a card that can be attacehd to a stage of a board. It represent a task which has not smaller tasks.

Projects, modules, features and tasks are conceptulization of jobs/goals. A project contains modules. Modeuls have features. Features break down into tasks. And tasks are recusive strucutres that can be a atual simple task or futher break down into smaller tasks.

A "leaf task", or a task that does not contain more smaller tasks can be converted into a card.

We can have "burn out" diagram or other diagrams based on projects.

# Database Design
Tables:

        users:
            list all users
            C: user_id, user_name, description

        boards:
            list all boards
            C: baord_id, board_name, description

        personnel:
            show the contributing boards of users
            C: board_id, user_id, rights

        stages:
            shows the stages of each board, stage "todo" of stage_seq 0 and stage "null" of stage_seq
            -1 are required for each board. Stage name can be arbitraritly changed.
            C: stage_id, belonging_board_id, stage_name, stage_seq, description

        tasks:
            shows all the tasks, explains the descriptions, task size, types etc.
            C: task_id, task_title, task_size, owner, description, task_type, stage_id

        task_types:
            shows all task types including project root, module, feature and task.
            this can be declared as enum type, but we do not want to rely on db functionalities
            C: task_type_id, task_type_name

        tags:
            shows all tags that has been created
            C: tag_id, tag_name

        task_tags:
            shows task tags
            C: task_id, tag_id

        projects:
            shows the tasks relationships between each other. It is basically a closure table
            that shows tree strucutre of each project which is a tree of tasks.
            The column "belonging_board_id" will be null unless the task is the root task of a
            project.
            C: task_id, task_distance, decendent_task_id

        actions:
            shows all possible actions
            C: action_id, action_name, action_description

            current actions upon setting up
            (action_id, action_name, description)" +
            (0, 'create project', 'create a project')," +
            (1, 'move stage', 'move a task to a new stage')," +
            (2, 'move task', 'move a task to a different parent task')," +
            (3, 'create task', 'create a new task as sub-task of an exisiting task')," +
            (4, 'tag task', 'tag a task')," +
            (5, 'change task type', 'change the type of a task');";

        editing_history:
            show progressing operations on tasks, i.e., adding/removing sub task, changing stage,
            moving task etc.
            C: timestamp, task_id, action_id, action_target

        comments:
            show comments on tasks
            C: comments, task_id, time_stamp, comments

