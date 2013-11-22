var passport = require('passport');

exports.callback = function(token, tokenSecret, profile, done) {
    exports.User.findOrCreate({
        linkedinId: profile.id,
        profile: profile
    }, function (err, user) {
        return done(err, user);
    });
};

exports.init = function (conf, app) {
    var Strategy = require('passport-linkedin-oauth2').OAuth2Strategy;
    passport.use(new Strategy({
	    clientID: conf.linkedin.apiKey,
	    clientSecret: conf.linkedin.secret,
            callbackURL: conf.baseURL + 'auth/linkedin/callback',
	    scope: ['r_emailaddress', 'r_basicprofile']
    }, exports.callback));

    app.get('/auth/linkedin',
        passport.authenticate('linkedin',{ state: 'SOME STATE'  }));
    app.get('/auth/linkedin/callback',
        passport.authenticate('linkedin', { failureRedirect: '/' }),
        exports.redirectOnSuccess);

};

