var passport = require('passport');

exports.callback =  function(accessToken, refreshToken, profile, done) {
	exports.User.findOrCreate({
		paypalId: profile.id,
		profile: profile
	},  function (err, user) {
		return done(err, user);
	});
};

exports.init = function(conf, app){
	PayPalStrategy = require('passport-paypal-oauth').Strategy;
	passport.use(new PayPalStrategy({
		clientID: conf.paypal.clientID,
		clientSecret: conf.paypal.clientSecret,
		callbackURL: conf.baseURL + 'auth/paypal/callback'
	},exports.callback));
	app.get('/auth/paypal',
		passport.authenticate('paypal',{ scope: 'openid profile email'  }),
		function(req, res){
		});

	app.get('/auth/paypal/callback',
		passport.authenticate('paypal', { failureRedirect: '/' }),
		function(req, res) {
			res.redirect('/');
		});

};