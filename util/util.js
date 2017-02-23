var winston = require('winston');
var config = require('../conf/config');

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      timestamp: function() {
        return Date.now();
      },
      formatter: function(options) {
        // Return string will be passed to logger.
        return options.timestamp() +' '+
               options.level.toUpperCase() +' '+
               (options.message ? options.message : '') +
               (options.meta && Object.keys(options.meta).length ? '\n\t'+
               JSON.stringify(options.meta) : '' );
      }
    })
  ]
});

switch (config.database) {
    case "postgres":
        break;
    default:
        throw (new TypeError("Queris in " + config.database + " is not prepared yet."));
}

module.exports = {
    logger: logger
}
