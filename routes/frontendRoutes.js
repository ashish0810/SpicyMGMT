var express = require('express');
var casChecker = require('../utils/middleware/casChecker');

module.exports = function(app, dbClient) {
	// Serves the static files in the public directory available
	// Only serving /public/scripts and not /public directly so that html files are not directly accessible
	app.use("/scripts", express.static("./public/scripts"));
	app.use("/style", express.static("./public/style"));

	// These routes will not use the casChecker.frontend middleware as it is the entry page when
	// users are not logged in or not authenticated with the application
	app.get('/entry', (req, res) => {
		res.sendFile("/public/entry.html", { root: "./" });
	});

	app.get('/request_access', (req, res) => {
		res.sendFile("/public/request.html", { root: "./" });
	});

	// These routes will use the casChecker.frontend middleware, serves the pages of the app
	app.get('/', casChecker.frontend(dbClient), (req, res) => {
		res.sendFile("/public/dash.html", { root: "./" });
	});

	app.get('/tasks', casChecker.frontend(dbClient), (req, res) => {
		res.sendFile("/public/tasks.html", { root: "./" });
	});

	app.get('/users', casChecker.frontend(dbClient), (req, res) => {
		res.sendFile("/public/users.html", { root: "./" });
	});

	app.get('/files', casChecker.frontend(dbClient), (req, res) => {
		res.sendFile("/public/files.html", { root: "./" });
	});

	app.get('/settings', casChecker.frontend(dbClient), (req, res) => {
		res.sendFile("/public/settings.html", { root: "./"});
	});

	app.get('/recycle', casChecker.frontend(dbClient), (req, res) => {
		res.sendFile("/public/recycle.html", { root: "./"});
	});
}
