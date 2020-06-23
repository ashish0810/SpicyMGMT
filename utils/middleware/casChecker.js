// Using our own middleware to check if logged in so that we can display message when not logged in
// Also, when logged in, this will not show the service ticket in url

// frontend and api do the same thing but just return different things (redirect vs json)

function frontend(dbClient) {
	return async (req, res, next) => {
		if (req.session.cas) {
			const data = await dbClient.getUserInfo(req.session.cas.user);
			if (data.length == 0) {
				res.redirect('/request_access');
				return;
			}
			req.session.userInfo = data[0];
			next();
		} else {
			res.redirect('/entry');
		}
	}
}

function api(dbClient) {
	return async (req, res, next) => {
		if (req.session.cas) {
			if (req.session.userInfo == undefined) {
				const data = await dbClient.getUserInfo(req.session.cas.user);
				if (data.length == 0) {
					res.json({ statusCode: 201 });
					return;
				}
				req.session.userInfo = data[0];
			}
			next();
		} else {
			res.json({ statusCode: 201 });
		}
	}
}

exports.frontend = frontend;
exports.api = api;
