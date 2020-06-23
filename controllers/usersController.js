// Controllers for routes related to users will go here
// TODO: add some input checking, permissions checking

function validate (req) {
	var special = new RegExp(/^[a-zA-Z0-9]*$/);
	var nameSpecial = new RegExp(/^[a-zA-Z0-9\s]{1,50}$/);
	var emailSpecial = new RegExp(/^(?=.{1,100}$)([^\s@]+@[^\s@]+\.[^\s@]+)$/);

	// Checking against undefined inputs
	if (req.body.dir_id==undefined || req.body.name==undefined || req.body.email==undefined ||
		req.body.role==undefined || req.body.tags==undefined) {
			console.log("1 Invalid input: undefined");
		return false;
	}
	// Checking against empty inputs
	if (req.body.dir_id.length==0 || req.body.name.length==0 || req.body.email.length==0 ||
		req.body.role.length==0) {
			console.log("2 Invalid input: required field empty");
		return false;
	}
	// Checking against illegal characters
	if (!special.test(req.body.dir_id) || !nameSpecial.test(req.body.name) || !emailSpecial.test(req.body.email) ||
		!special.test(req.body.role)) {
			console.log("3 Invalid input: illegal characters in entry");
		return false;
	}
	var tagsTrim = req.body.tags.split(",");
	for (var i=0; i<tagsTrim; i++) {
		tagsTrim[i] = tagsTrim[i].trim();
		tagsTrim[i] = tagsTrim[i].leftTrim();
	}
	req.body.tags=tagsTrim.join(",");
	
	return true;
}

async function getCurrUser(req, res, dbClient) {
	try {
		const data = await dbClient.getUserInfo(req.session.cas.user);
		res.json({
			sucess: true,
			data: data[0]
		});
	} catch (e) {
		console.log("getCurrUser() promise rejection: " + e);
		res.json({ success: false,
			rejection: true });
	}
}

async function editCurrUser(req, res, dbClient) {
	var nameSpecial = new RegExp(/^[a-zA-Z0-9\s]{1,50}$/);
	var emailSpecial = new RegExp(/^(?=.{1,100}$)([^\s@]+@[^\s@]+\.[^\s@]+)$/);

	if (req.body.name == undefined || req.body.name.length == 0 || req.body.email == undefined || req.body.email.length == 0
		|| !nameSpecial.test(req.body.name) || !emailSpecial.test(req.body.email)) {
		console.log("Invalid input in edit current user");
		res.json({ success: false,
				   rejection: false });
		res.end();
		return;
	}
	try {
		const result = await dbClient.editCurrUser(req.session.cas.user, req.body.name, req.body.email);
		const success = result.affectedRows == 1;
		const data = await dbClient.getUserInfo(req.session.cas.user);
		req.session.userInfo = data[0];
		res.json({ success: success });
	} catch (e) {
		console.log("editCurrUser() promise rejection: " + e);
		res.json({ success: false,
			rejection: true });
	}
}

async function getUsers(req, res, dbClient) {
	try {
		const data = await dbClient.getUsers();
		res.json({
			success: true,
			data: data
		});
	} catch(e) {
		console.log("getUsers() promise rejection: " + e);
		res.json({
			success: false,
			rejection: true
		});
	}
}

async function getTags(req, res, dbClient) {
	try {
		const data = await dbClient.getUsers();
		var tags = [];
		var tagMap = {};
		var userIds = [];
		var userNames = [];
		var userMap = {}
		for (var i = 0; i < data.length; i++) {
			var split = data[i].tags.split(",");
			for (var j = 0; j < split.length; j++) {
				if (tagMap[split[j]] == undefined) {
					tagMap[split[j]] = [];
				}
				tagMap[split[j]].push(data[i].dir_id);
				if (!tags.includes(split[j])) {
					tags.push(split[j]);
				}
			}
			userNames.push(data[i].name);
			userIds.push(data[i].dir_id);
			userMap[data[i].name] = data[i].dir_id;
		}
		res.json({
			success: true,
			data: {
			tags: tags,
			tagMap: tagMap,
			users: userNames,
			userIds: userIds,
			userMap: userMap
		}});
	} catch(e) {
		console.log("getTags() promise rejection: " + e);
		res.json({ success: false,
			rejection: true });
	}
}

async function getStatistics(req, res, dbClient) {
	try {
		const data = await dbClient.getUsers();
		var dict = {};
		for (var i = 0; i < data.length; i++) {
			var subtasks = await dbClient.getSubtasksForUser(data[i].dir_id);
			dict[data[i].dir_id] = [];
			for (var j = 0; j < subtasks.length; j++) {
				var subtask = await dbClient.getSubtask(subtasks[j].subtask_id);
				var task = await dbClient.getTask(subtask[0].task_id);
				dict[data[i].dir_id].push({
						due_date: task[0].due_date,
						completed: subtasks[j].completed
				});
			}
		}
		res.json({ success: true,
			data: dict});
	} catch(e) {
		console.log("getStatistics() promise rejection: " + e);
		res.json({ success: false,
			rejection: true });
	}
}

async function addUser(req, res, dbClient) {
	if (!validate(req)) {
		console.log("Invalid input in add user.");
		res.json({ success: false,
			rejection: false });
		res.end();
		return;
	}
	try {
		const success = await dbClient.addUser(req.body.dir_id, req.body.name, req.body.email, req.body.role, process.env.DB_NAME, req.body.tags);
		const data = await dbClient.getUsers();
		res.json({
			success: success,
			data: data
		});
	} catch(e) {
		console.log("addUser() promise rejection: " + e);
		res.json({ success: false,
			rejection: true });
	}
}

async function editUser(req, res, dbClient) {
	if (!validate(req)) {
		console.log("Invalid input in edit user.");
		res.json({ success: false,
			rejection: false });
		res.end();
		return;
	}
	try {
		const success = await dbClient.editUser(req.body.dir_id, req.body.name, req.body.email, req.body.role, process.env.DB_NAME, req.body.tags);
		const data = await dbClient.getUsers();
		res.json({
			success: success,
			data: data
		});
	} catch(e) {
		console.log("editUser() promise rejection: " + e);
		res.json({ success: false,
			rejection: true });
	}
}

async function deleteUser(req, res, dbClient) {
	try {
		const success = await dbClient.deleteUser(req.body.dir_id);
		const data = await dbClient.getUsers();
		res.json({
			success: success,
			data: data
		});
	} catch(e) {
		console.log("deleteUser() promise rejection: " + e);
		res.json({ success: false,
			rejection: true });
	}
}

exports.getCurrUser = getCurrUser;
exports.editCurrUser = editCurrUser;
exports.getUsers = getUsers;
exports.addUser = addUser;
exports.editUser = editUser;
exports.deleteUser = deleteUser;
exports.getTags = getTags;
exports.getStatistics = getStatistics;
