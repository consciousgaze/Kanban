module.exports = {
    prod_server_config : {
        port : '8888'
    },
    test_server_config : {
        port : '8888'
    },
    db_config : {
        host : '127.0.0.1',
        user : 'normal',
        port : '5432'
    },
    prod_db : 'kanban',
    devl_db : 'kanban_dev',
    test : true,
    database: 'postgres'
    //Supported databases are postgresql
}
