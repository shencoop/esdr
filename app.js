// dependencies
var express = require('express');
var app = express();

var log = require('log4js').getLogger();
log.info("Environment: " + app.get('env'));

var config = require('./config');
var path = require('path');
var favicon = require('serve-favicon');
var compress = require('compression');
var requestLogger = require('morgan');
var bodyParser = require('body-parser');
var passport = require('passport');
var Database = require("./models/Database");

// decorate express.response with JSend methods
require('./lib/jsend');

var gracefulExit = function() {
   // TODO: any way (or need?) to gracefully shut down the database pool?
   log.info("Shutting down...");
   process.exit(0);
};

// If the Node process ends, then do a graceful shutdown
process
      .on('SIGINT', gracefulExit)
      .on('SIGTERM', gracefulExit);

// start by initializing the database and getting a reference to it
Database.create(function(err, db) {
   if (err) {
      log.error("Failed to initialize the database!" + err);
   }
   else {
      log.info("Database initialized, starting app server...");

      // configure the app
      try {
         // middleware
         var oauthServer = require('./middleware/oauth2')(db.users, db.tokens);   // create and configure OAuth2 server
         var error_handlers = require('./middleware/error_handlers');

         // MIDDLEWARE -------------------------------------------------------------------------------------------------

         // setup middleware
         app.use(favicon(path.join(__dirname, 'public/favicon.ico')));     // favicon serving
         app.use(requestLogger('dev'));      // request logging
         app.use(compress());                // enables gzip compression
         app.use(bodyParser.urlencoded({ extended : true }));     // form parsing
         app.use(bodyParser.json());         // json body parsing
         app.use(function(error, req, res, next) { // function MUST have arity 4 here!
            // catch invalid JSON error (found at http://stackoverflow.com/a/15819808/703200)
            res.status(400).json({status : "fail", data : "invalid JSON"})
         });
         app.use(passport.initialize());                                   // initialize passport (must come AFTER session middleware)
         app.use(express.static(path.join(__dirname, 'public')));          // static file serving

         // configure passport
         require('./middleware/auth')(db.clients, db.users, db.tokens);

         // ROUTING ----------------------------------------------------------------------------------------------------

         // configure routing
         app.use('/oauth', require('./routes/oauth')(oauthServer));
         app.use('/api/v1/users', require('./routes/api/users')(db.users));
         app.use('/api/v1/clients', require('./routes/api/clients')(db.clients));
         app.use('/', require('./routes/index'));

         // ERROR HANDLERS ---------------------------------------------------------------------------------------------

         // custom 404
         app.use(error_handlers.http404);

         // dev and prod should handle errors differently: e.g. don't show stacktraces in prod
         app.use((app.get('env') === 'development') ? error_handlers.development : error_handlers.production);

         // ------------------------------------------------------------------------------------------------------------

         // set the port and start the server
         app.set('port', config.get("server:port"));
         var server = app.listen(app.get('port'), function() {
           log.info('Express server listening on port ' + server.address().port);
         });

      }
      catch (err) {
         log.error("Sever initialization failed ", err.message);
      }
   }
});