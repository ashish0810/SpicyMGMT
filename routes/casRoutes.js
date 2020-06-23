var url = require('url');

// CAS stuff, we don't really need to touch this anymore
// All other routes will check if logged in using casChecker middleware

module.exports = function(app, cas) {
	// This route has the serviceValidate middleware, which verifies
	// that CAS authentication has taken place, and also the
	// authenticate middleware, which requests it if it has not already
	// taken place.
	app.get('/login', cas.serviceValidate(), cas.authenticate(), function(req, res) {
		// Great, we logged in, now redirect back to the home page.
		return res.redirect('/');
	});
	
	app.get('/logout', function(req, res) {
		if (!req.session) {
			return res.redirect('/');
		}
		// Forget our own login session
		if (req.session.destroy) {
			req.session.destroy();
		} else {
			// Cookie-based sessions have no destroy()
			req.session = null;
		}
		// Send the user to the official campus-wide logout URL
		var options = cas.configure();
		options.pathname = options.paths.logout;
		return res.redirect(url.format(options));
	});
}