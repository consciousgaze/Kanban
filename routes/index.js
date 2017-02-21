var express = require('express');
var lib = require('../util')
var server = express();

// static pages
server.use('/', express.static(__dirname + '/public'));

// drop
server.post('/drop', function(req, res) {
    var data = '';
    req.on('data', function(d){
        data += d;
    });

    req.on('end', function() {console.log(data);});
});

// show author
server.get('/author', author);

module.exports = server;
