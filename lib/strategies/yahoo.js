var passport = require('passport')


exports.callback = function(token, tokenSecret, profile, done) {
    exports.User.findOrCreate({
        yahooId: profile.id,
        profile: profile
    }, function (err, user) {
        return done(err, user);
    });
};

exports.init = function (conf, app) {
    var YahooStrategy = require('passport-yahoo-oauth').Strategy;
    passport.use(new YahooStrategy({
        consumerKey: conf.yahoo.consumerKey,
        consumerSecret: conf.yahoo.consumerSecret,
        callbackURL: conf.baseURL + 'auth/yahoo/callback'
    }, exports.callback));

    app.get('/auth/yahoo',
        passport.authenticate('yahoo'),
        function(req, res){

        });

    app.get('/auth/yahoo/callback',
        passport.authenticate('yahoo', {
            failureRedirect: conf.failureRedirect || '/'
        }), exports.redirectOnSuccess);
};