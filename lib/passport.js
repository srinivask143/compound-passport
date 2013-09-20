var Passport = require('passport').Passport;
var yaml = require('yaml-js');
var fs = require('fs');
var path = require('path');

exports.strategies = [];

exports.redirectOnSuccess = function redirectOnSuccess(req, res) {
    var redir = '/';
    if (req.session.redirect) {
        redir = req.session.redirect;
        delete req.session.redirect;
    }
    res.redirect(redir);
};

var stratDir = __dirname + '/strategies/';
fs.readdirSync(stratDir).forEach(function (file) {
    if (file.match(/[^\.].*?\.js$/)) {
        var name = file.replace(/\.js$/, '');
        exports.strategies[name] = require(stratDir + file);
        exports.strategies[name].redirectOnSuccess = exports.redirectOnSuccess;
    }
});

function requireIfExists(compound, file) {
    var confFile = path.join(compound.root, 'config', file);
    if (fs.existsSync(confFile)) {
        var conf = require(confFile);
        if (typeof(conf) == "function") {
            return conf(compound);
        } else {
            return conf;
        }
    }
    return null;
}

exports.init = function (compound) {
    var app = compound.app;
    var passport = new Passport;

    (function injectRoutes() {

        var gotRouter, i, l = app.stack.length;
        app.stack.forEach(function (r, i) {
            if (r.handle === app.router) {
                gotRouter = i;
            }
        });
        for (i = l; i > gotRouter; i--) {
            app.stack[i + 1] = app.stack[i - 1];
        }
        if (gotRouter) {
            app.stack[gotRouter] = {route: '', handle: passport.initialize()};
            app.stack[gotRouter + 1] = {route: '', handle: passport.session()};
        } else {
            app.use(passport.initialize());
            app.use(passport.session());
            app.use(app.router);
        }
    })();

    var conf = requireIfExists(compound, 'passport.js') || requireIfExists(compound, 'passport.coffee');
    if (!confi) {
        conf = fs.readFileSync(app.root + '/config/passport.yml', 'utf8').toString();
        conf = yaml.load(conf);
    }
	if (!conf) {
        console.log("WARN: can not find passport configurations skipping passport configuration");
        return;
    }
    if (conf && conf instanceof Array) conf = conf[0];
    conf = conf[app.set('env')];
    Object.keys(exports.strategies).forEach(function (str) {
        if (conf[str]) {
            exports.strategies[str].init(conf, app);
        };
    });

    compound.on('models', function(models) {
        if (models.User) {
            exports.loadUser(models.User);
        }
    });

    compound.on('structure', function(s) {
        s.controllers.auth = function AuthController() {
            this.__missingAction = function (c) {
                c.next();
            };
        };
    });

    app.get('/auth/:idp/*', function (req, res) {
        res.send('Provider `' + req.params.idp + '` is not enabled. Specify appropriated settings in config/passport.yml file');
    });

    // convert user to userId
    passport.serializeUser(function serializeUser(user, done) {
        done(null, user.id);
    });

    // convert userId to user
    passport.deserializeUser(function deserializeUser(userId, done) {
        exports.User.find(userId, function (err, user) {
            done(err, user);
        });
    });

};

exports.loadUser = function (u) {
    if (!u.findOrCreate) {
        u.findOrCreate = require('./user.js').findOrCreate;
    }
    Object.keys(exports.strategies).forEach(function (str) {
        exports.strategies[str].User = u;
    });
    exports.User = u;
};
