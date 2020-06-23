// Checks that the user's role is "Admin"
// This is only for backend permissions, either allowing or denying certain routes to users

function admin(req, res, next) {
	if (req.session.userInfo.role != "Admin") {
		console.log("Request rejected due to incorrect role");
		res.json({ success: false });
		return;
	} else {
		next();
	}
}

exports.admin = admin;