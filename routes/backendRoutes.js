var casChecker = require('../utils/middleware/casChecker');
var roleChecker = require('../utils/middleware/roleChecker');

var usersController = require('../controllers/usersController');
var emailsController = require('../controllers/emailsController');
var filesController = require('../controllers/filesController');
var tasksController = require('../controllers/tasksController');

module.exports = function(app, dbClient, transporter, upload) {
	// This route will not use the casChecker.api middleware as it is just a sanity test
	app.get('/api', function(req, res) {
		res.json({ success: true });
	});

////////// FILE ROUTES //////////

	app.get('/api/files', casChecker.api(dbClient), (req, res) => {
		filesController.getFiles(req, res, dbClient);
	});

	app.post('/api/files/folder', casChecker.api(dbClient), (req, res) => {
		filesController.createFolder(req, res, dbClient);
	});

	app.post('/api/files/del/version', casChecker.api(dbClient), (req, res) => {
		filesController.deleteFileVersion(req, res, dbClient);
	});

	app.post('/api/files/rec/version', casChecker.api(dbClient), (req, res) => {
		filesController.recoverFileVersion(req, res, dbClient);
	});

	app.delete('/api/files/version', casChecker.api(dbClient), (req, res) => {
		filesController.hardDeleteFile(req, res, dbClient);
	});

	app.delete('/api/files', casChecker.api(dbClient), (req, res) => {
		filesController.deleteFile(req, res, dbClient);
	});

	app.post('/uploadfiles', casChecker.api(dbClient), upload.array('myFiles', 100), (req, res) => {
		filesController.addFiles(req, res, dbClient);
	});

	app.get('/api/files/download', casChecker.api(dbClient), (req, res) => {
		filesController.downloadFile(req, res, dbClient);
	});

////////// USER ROUTES //////////

	app.get('/api/user', casChecker.api(dbClient), (req, res) => {
		usersController.getCurrUser(req, res, dbClient);
	});

	app.post('/api/user', casChecker.api(dbClient), (req, res) => {
		usersController.editCurrUser(req, res, dbClient);
	});

	app.get('/api/users', casChecker.api(dbClient), (req, res) => {
		usersController.getUsers(req, res, dbClient);
	});

	app.post('/api/users', casChecker.api(dbClient), roleChecker.admin, (req, res) => {
		usersController.addUser(req, res, dbClient);
	});

	app.get('/api/users/tags', casChecker.api(dbClient), (req, res) => {
		usersController.getTags(req, res, dbClient);
	});

	app.get('/api/users/stats', casChecker.api(dbClient), (req, res) => {
		usersController.getStatistics(req, res, dbClient);
	});

	app.post('/api/users/edit', casChecker.api(dbClient), roleChecker.admin, (req, res) => {
		usersController.editUser(req, res, dbClient);
	});

	app.delete('/api/users', casChecker.api(dbClient), roleChecker.admin, (req, res) => {
		usersController.deleteUser(req, res, dbClient);
	});

////////// TASK ROUTES //////////

	app.get('/api/tasks', casChecker.api(dbClient), (req, res) => {
		tasksController.getTasks(req, res, dbClient);
	});

	app.post('/api/tasks', casChecker.api(dbClient), roleChecker.admin, (req, res) => {
		tasksController.addTask(req, res, dbClient);
	});

	app.post('/api/tasks/subtasks', casChecker.api(dbClient), roleChecker.admin, (req, res) => {
		tasksController.addSubtask(req, res, dbClient);
	});

	app.post('/api/tasks/edit', casChecker.api(dbClient), roleChecker.admin, (req, res) => {
		tasksController.editTask(req, res, dbClient);
	});

	app.post('/api/tasks/subtasks/edit', casChecker.api(dbClient), roleChecker.admin, (req, res) => {
		tasksController.editSubtask(req, res, dbClient);
	});

	app.post('/api/tasks/subtasks/files/edit', casChecker.api(dbClient), (req, res) => {
		tasksController.editSubtaskFiles(req, res, dbClient);
	});

	app.get('/api/tasks/comments/subtask', casChecker.api(dbClient), (req, res) => {
		tasksController.getSubtaskComments(req, res, dbClient);
	});

	app.post('/api/tasks/comments', casChecker.api(dbClient), (req, res) => {
		tasksController.addComment(req, res, dbClient);
	});

	app.delete('/api/tasks', casChecker.api(dbClient), roleChecker.admin, (req, res) => {
		tasksController.deleteTask(req, res, dbClient);
	});

	app.delete('/api/tasks/subtasks', casChecker.api(dbClient), roleChecker.admin, (req, res) => {
		tasksController.deleteSubtask(req, res, dbClient);
	});

	app.put('/api/tasks/mark', casChecker.api(dbClient), (req, res) => {
		tasksController.markSubtask(req, res, dbClient);
	});

	app.put('/api/tasks/markall', casChecker.api(dbClient), roleChecker.admin, (req, res) => {
		tasksController.markSubtaskAll(req, res, dbClient);
	});

////////// EMAIL ROUTES //////////

	// Send email reminder routes
	// Calls function from emailController.js, pass along extra param transporter
	app.post('/sendreminder', casChecker.api(dbClient), roleChecker.admin, (req, res) => {
		emailsController.sendReminder(req, res, dbClient, transporter);
	});

	app.post('/sendmassreminder', casChecker.api(dbClient), roleChecker.admin, (req, res) => {
		emailsController.sendMassReminder(req, res, dbClient, transporter);
	});
}
