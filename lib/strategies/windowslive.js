var passport = require('passport')


exports.callback = function(accessToken, refreshToken, profile, done) {
    exports.User.findOrCreate({
        windowsliveId: profile.id,
        profile: profile
    }, function (err, user) {
        return done(err, user);
    });
};

exports.init = function (conf, app) {
    var WindowsLiveStrategy = require('passport-windowslive').Strategy;
    passport.use(new WindowsLiveStrategy({
        clientID: conf.windowslive.clientID,
        clientSecret: conf.windowslive.clientSecret,
        callbackURL: conf.baseURL + 'auth/windowslive/callback'
    }, exports.callback));

    app.get('/auth/windowslive',
        passport.authenticate('windowslive',{ scope: ['wl.signin', 'wl.basic'] }));

    app.get('/auth/windowslive/callback',
        passport.authenticate('windowslive', {
            failureRedirect: conf.failureRedirect || '/'
        }), exports.redirectOnSuccess);

};
