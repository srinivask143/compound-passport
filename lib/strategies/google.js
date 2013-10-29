var passport = require('passport');

exports.callback = function (identifier, tokenSecret, profile, done) {
	exports.User.findOrCreate({
		googleId: identifier,
		profile: profile
	}, function (err, user) {
		done(err, user);
	});
};

exports.init = function (conf, app) {
	var Strategy = require('passport-google-oauth').OAuth2Strategy;
	var defscopes = [
		'https://www.googleapis.com/auth/plus.me'
		, 'https://www.googleapis.com/auth/userinfo.email'
		, 'https://www.googleapis.com/auth/userinfo.profile'
	];
	passport.use(new Strategy({
		clientID: conf.google.clientID
		, clientSecret: conf.google.clientSecret
		, callbackURL: conf.baseURL + 'auth/google/callback'
	}, exports.callback));

	app.get('/auth/google',
		passport.authenticate('google', {scope: conf.google.scope || defscopes}));
	app.get('/auth/google/callback',
		passport.authenticate('google', { failureRedirect: '/' }),
		exports.redirectOnSuccess);
};

