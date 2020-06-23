// Controllers for routes related to tasks will go here

function validateAddTask(req) {
	var special = new RegExp(/^[a-zA-Z0-9]*$/);
	var nameSpecial = new RegExp(/^[a-zA-Z0-9\s]{1,50}$/);
	var stageSpecial = new RegExp(/^[0-9]*$/);
	// Unnecessary if all browser inputs are done through the calendar, which doesn't show up in Safari
	var dueSpecial = new RegExp(/^([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))[\s]([01]\d|2[0-3]):?([0-5]\d):00$/);
	var descrSpecial = new RegExp(/^[a-zA-Z0-9\s,.!;?()""]{0,500}$/);

	// Checking against undefined inputs in task
	if (req.body.name==undefined || req.body.description==undefined ||
		req.body.subtasks==undefined) {
			console.log("1-task");
		return false;
	}

	// Checking against empty inputs in task
	if (req.body.name.length==0 || req.body.subtasks.length==0 || req.body.description > 500) {
			console.log("2-task");
		return false;
	}

	// Checking against illegal characters in task
	if (!nameSpecial.test(req.body.name) || req.body.due != undefined && !dueSpecial.test(req.body.due) ||
		!descrSpecial.test(req.body.description)) {
			console.log("3-task");
		return false;
	}

	for (var i=0; i < req.body.subtasks.length; i++) {
		// Checking against undefined inputs in subtask
		if (req.body.subtasks[i].stage == 0 || req.body.subtasks[i].stage == undefined || req.body.subtasks[i].stage <= 0) {
			req.body.subtasks[i].stage = 1;
		}

		if (req.body.subtasks[i].name==undefined || req.body.subtasks[i].description==undefined || 
			req.body.subtasks[i].assignedTo==undefined || req.body.subtasks[i].files==undefined) {
			console.log("1-subtask "+i);
			return false;
		}

		// Checking against empty inputs in subtask
		if (req.body.subtasks[i].name.length==0 || req.body.subtasks[i].description.length > 500) {
			console.log("2-subtask "+i);
			return false;
		}

		// Checking against illegal characters in subtask
		if (!nameSpecial.test(req.body.subtasks[i].name) || !descrSpecial.test(req.body.subtasks[i].description) ||
			!stageSpecial.test(req.body.subtasks[i].stage)) {
			console.log("3-subtask "+i);
			return false;
		}

		for (var j=0; j<req.body.subtasks[i].assignedTo.length; j++) {
			// Checking against all undefined inputs in subtask assignedTo array
			if (req.body.subtasks[i].assignedTo[j]==undefined) {
				console.log("1-subtask "+i+", assignedTo "+j);
				return false;
			}
			// Checking against illegal characters in subtask assignedTo array
			if (!special.test(req.body.subtasks[i].assignedTo[j])) {
				console.log("1-subtask "+i+", assignedTo "+j);
				return false;
			}
		}

		for (var j = 0; j < req.body.subtasks[i].files.length; j++) {
			if (req.body.subtasks[i].files[j].doc_id == undefined || req.body.subtasks[i].files[j].version == undefined) {
				console.log("1-subtask "+i+", files "+j);
				return false;
			}
		}
	}
	return true;
}

function validateEditTask(req) {
	var nameSpecial = new RegExp(/^[a-zA-Z0-9\s]{1,50}$/);
	var taskIdSpecial = new RegExp(/^[0-9]*$/);
	// Unnecessary if all browser inputs are done through the calendar, which doesn't show up in Safari
	var dueSpecial = new RegExp(/^([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))[\s]([01]\d|2[0-3]):?([0-5]\d):00$/);
	var descrSpecial = new RegExp(/^[a-zA-Z0-9\s,.!;?()""]{0,500}$/);

	// Checking against undefined inputs in task
	if (req.body.task_id==undefined || req.body.name==undefined || req.body.description==undefined) {
		console.log("1-edit-task");
		return false;
	}

	// Checking against empty inputs in task
	if (req.body.task_id.length==0 || req.body.name.length==0 || req.body.description.length > 500) {
		console.log("2-edit-task");
		return false;
	}

	// Checking against illegal characters in task
	if (!taskIdSpecial.test(req.body.task_id) || !nameSpecial.test(req.body.name) || !descrSpecial.test(req.body.description) ||
		req.body.due!=undefined && !dueSpecial.test(req.body.due)) {
		console.log("3-edit-task");
		return false;
	}
	return true;
}

function validateAddSubtask(req) {
	var special = new RegExp(/^[a-zA-Z0-9]*$/);
	var nameSpecial = new RegExp(/^[a-zA-Z0-9\s]{1,50}$/);
	var stageSpecial = new RegExp(/^[0-9]*$/);
	var taskIdSpecial = new RegExp(/^[0-9]*$/);
	var descrSpecial = new RegExp(/^[a-zA-Z0-9\s,.!;?()""]{0,500}$/);

	if (req.body.stage == 0 || req.body.stage == undefined || req.body.stage <= 0) {
		req.body.stage = 1;
	}

	// Checking against undefined inputs in subtask
	if (req.body.task_id==undefined || req.body.name==undefined || req.body.description==undefined ||
		req.body.assignedTo==undefined || req.body.files==undefined ) {
		console.log("1-add-subtask");
		return false;
	}

	// Checking against empty inputs in subtask
	if (req.body.task_id.length==0 || req.body.name.length==0 || req.body.description.length > 500) {
		console.log("2-add-subtask");
		return false;
	}

	// Checking against illegal characters in subtask
	if (!taskIdSpecial.test(req.body.task_id) || !nameSpecial.test(req.body.name) || !descrSpecial.test(req.body.description) ||
		!stageSpecial.test(req.body.stage)) {
		console.log("3-add-subtask");
		return false;
	}

	// Checking against all values in assignedTo
	for (var i=0; i < req.body.assignedTo.length; i++) {
		// Checking against all undefined inputs in subtask assignedTo array
		if (req.body.assignedTo[i]==undefined) {
			console.log("1-add-subtask, assignedTo "+i);
			return false;
		}
		// Checking against illegal characters in subtask assignedTo array
		if (!special.test(req.body.assignedTo[i])) {
			console.log("3-add-subtask, assignedTo "+i);
			return false;
		}

	}

	// Checking against all values in files
	for (var i=0; i < req.body.files.length; i++) {
		// Checking against all undefined inputs in subtask files array
		if (req.body.files[i].doc_id == undefined || req.body.files[i].version == undefined) {
			console.log("1-add-subtask, files "+i);
			return false;
		}

	}
	return true;
}

function validateEditSubtask(req) {
	var special = new RegExp(/^[a-zA-Z0-9]*$/);
	var nameSpecial = new RegExp(/^[a-zA-Z0-9\s]{1,50}$/);
	var stageSpecial = new RegExp(/^[0-9]*$/);
	var taskIdSpecial = new RegExp(/^[0-9]*$/);
	var descrSpecial = new RegExp(/^[a-zA-Z0-9\s,.!;?()""]{0,500}$/);

	if (req.body.stage == 0 || req.body.stage == undefined || req.body.stage <= 0) {
		req.body.stage = 1;
	}

	// Checking against undefined inputs in subtask
	if (req.body.subtask_id==undefined || req.body.name==undefined || req.body.description==undefined ||
		req.body.assignedTo==undefined || req.body.files==undefined ) {
		console.log("1-edit-subtask");
		return false;
	}

	// Checking against empty inputs in subtask
	if (req.body.subtask_id.length==0 || req.body.name.length==0 || req.body.description.length > 500) {
		console.log("2-edit-subtask");
		return false;
	}

	// Checking against illegal characters in subtask
	if (!taskIdSpecial.test(req.body.subtask_id) || !nameSpecial.test(req.body.name) || !descrSpecial.test(req.body.description) ||
		!stageSpecial.test(req.body.stage)) {
		console.log("3-edit-subtask");
		return false;
	}

	// Checking against all values in assignedTo
	for (var i=0; i < req.body.assignedTo.length; i++) {
		// Checking against all undefined inputs in subtask assignedTo array
		if (req.body.assignedTo[i]==undefined) {
			console.log("1-edit-subtask, assignedTo "+i);
			return false;
		}
		// Checking against illegal characters in subtask assignedTo array
		if (!special.test(req.body.assignedTo[i])) {
			console.log("3-edit-subtask, assignedTo "+i);
			return false;
		}
	}

	// Checking against all values in files
	for (var i=0; i < req.body.files.length; i++) {
		// Checking against all undefined inputs in subtask files array
		if (req.body.files[i].doc_id == undefined || req.body.files[i].version == undefined) {
			console.log("1-edit-subtask, files "+i);
			return false;
		}

	}
	return true;
}

function validateEditSubtaskFiles(req) {
	var taskIdSpecial = new RegExp(/^[0-9]*$/);

	// Checking against undefined inputs in subtask
	if (req.body.subtask_id==undefined || req.body.files==undefined ) {
		console.log("1-edit-subtask-files");
		return false;
	}

	// Checking against empty inputs in subtask
	if (req.body.subtask_id.length==0) {
		console.log("2-edit-subtask-files");
		return false;
	}

	// Checking against illegal characters in subtask
	if (!taskIdSpecial.test(req.body.subtask_id)) {
		console.log("3-edit-subtask-files");
		return false;
	}

	// Checking against all values in files
	for (var i=0; i < req.body.files.length; i++) {
		// Checking against all undefined inputs in subtask files array
		if (req.body.files[i].doc_id == undefined || req.body.files[i].version == undefined) {
			console.log("1-edit-subtask-files, files "+i);
			return false;
		}

	}
	return true;
}

function makeMappingDirIdToName(users) {
	var data = {};
	for (var i = 0; i < users.length; i++) {
		data[users[i].dir_id] = users[i].name;
	}
	return data;
}

async function getTaskData(dbClient) {
	try {
		var users = await dbClient.getUsers();
		var dirIdToName = makeMappingDirIdToName(users);
		var tasks = await dbClient.getTasks();
		var data = []
		for (var i = 0; i < tasks.length; i++) {
			var task = {
				task_id: tasks[i].task_id,
				name: tasks[i].name,
				description: tasks[i].description,
				due: tasks[i].due_date,
				completed: true,
				subtasks: []
			}
			var subtasks = await dbClient.getSubtasks(tasks[i].task_id);
			for (var j = 0; j < subtasks.length; j++) {
				var subtask = {
					subtask_id: subtasks[j].subtask_id,
					name: subtasks[j].name,
					description: subtasks[j].description,
					stage: subtasks[j].priority_number,
					completed: true,
					assignedTo: [],
					files: []
				}
				var people = await dbClient.getUsersForSubtask(subtasks[j].subtask_id);
				for (var k = 0; k < people.length; k++) {
					var name = dirIdToName[people[k].dir_id] ? dirIdToName[people[k].dir_id] : people[k].dir_id;
					person = {
						dir_id: people[k].dir_id,
						name: name,
						completed: (people[k].completed == 1)
					}
					subtask.completed = subtask.completed && (person.completed);
					subtask.assignedTo.push(person);
				}
				var files = await dbClient.getFilesForSubtask(subtasks[j].subtask_id);
				for (var k = 0; k < files.length; k++) {
					var doc = await dbClient.getDocument(files[k].doc_id, files[k].version);
					subtask.files.push(doc[0]);
				}
				task.completed = task.completed && (subtask.completed);
				task.subtasks.push(subtask);
			}
			data.push(task);
		}
		return data;
	} catch(e) {
		console.log("getTaskData() promise rejection: " + e);
		res.json({ success: false,
			rejection: true });
	}
}

async function getTasks(req, res, dbClient) {
	var data = await getTaskData(dbClient);
	res.json({ data: data });
}

async function addTask(req, res, dbClient) {
	if (!validateAddTask(req)) {
		console.log("Invalid input in add task.");
		res.json({ success: false,
			rejection: false });
		res.end();
		return;
	}
	try {
		const taskResponse = await dbClient.addTask(req.body.name, req.body.description, req.body.due);
		var success = taskResponse.affectedRows == 1;
		// console.log(taskResponse.insertId);
		const taskId = taskResponse.insertId;
		for (var i = 0; i < req.body.subtasks.length; i++) {
			var subtaskResponse = await dbClient.addSubtask(taskId, req.body.subtasks[i].name, req.body.subtasks[i].description, req.body.subtasks[i].stage);
			const subtaskId = subtaskResponse.insertId;
			success = success && (subtaskResponse.affectedRows == 1);
			for (var j = 0; j < req.body.subtasks[i].assignedTo.length; j++) {
				var userToSubtaskResponse = await dbClient.addUserToSubtask(req.body.subtasks[i].assignedTo[j], subtaskId);
				success = success && (userToSubtaskResponse.affectedRows == 1);
			}
			for (var j = 0; j < req.body.subtasks[i].files.length; j++) {
				var file = req.body.subtasks[i].files[j];
				var fileToSubtaskResponse = await dbClient.addFileToSubtask(file.doc_id, file.version, subtaskId);
				success = success && (fileToSubtaskResponse.affectedRows == 1);
			}
		}
		const data = await getTaskData(dbClient);
		res.json({
			success: success,
			data: data
		});
	} catch(e) {
		console.log("addTask() promise rejection: " + e);
		res.json({ success: false,
			rejection: true });
	}
}

async function addSubtask(req, res, dbClient) {
	if (!validateAddSubtask(req)) {
		console.log("Invalid input in add task.");
		res.json({ success: false,
			rejection: false });
		res.end();
		return;
	}
	try {
		var subtaskResponse = await dbClient.addSubtask(req.body.task_id, req.body.name, req.body.description, req.body.stage);
		var success = subtaskResponse.affectedRows == 1;
		var people = req.body.assignedTo;
		for (var i = 0; i < people.length; i++){
			var response = await dbClient.addUserToSubtask(people[i], subtaskResponse.insertId);
			success = success && (response.affectedRows == 1);
		}
		var files = req.body.files;
		for (var i = 0; i < files.length; i++){
			var response = await dbClient.addFileToSubtask(files[i].doc_id, files[i].version, subtaskResponse.insertId);
			success = success && (response.affectedRows == 1);
		}
		const data = await getTaskData(dbClient);
		res.json({
			success: success,
			data: data
		});
	} catch(e) {
		console.log("addSubtask() promise rejection: " + e);
		res.json({ success: false,
			rejection: true });
	}
}

async function editTask(req, res, dbClient) {
	if (!validateEditTask(req)) {
		console.log("Invalid input in edit task.");
		res.json({ success: false,
			rejection: false });
		res.end();
		return;
	}
	try {
		const response = await dbClient.editTask(req.body.task_id, req.body.description, req.body.name, req.body.due);
		var success = response.affectedRows == 1;
		const data = await getTaskData(dbClient);
		res.json({
			success: success,
			data: data
		});
	} catch(e) {
		console.log("editTask() promise rejection: " + e);
		res.json({ success: false,
			rejection: true });
	}
}

async function editSubtask(req, res, dbClient) {
	if (!validateEditSubtask(req)) {
		console.log("Invalid input in edit subtask.");
		res.json({ success: false,
			rejection: false });
		res.end();
		return;
	}
	try {
		var subID = req.body.subtask_id;
		var response = await dbClient.editSubtask(subID, req.body.name, req.body.description, req.body.stage);
		var success = response.affectedRows == 1;

		var people = await dbClient.getUsersForSubtask(subID);
		var dbList = [];
		var feList = req.body.assignedTo;
		for (var i = 0; i < people.length; i++){
			dbList.push(people[i].dir_id);
		}
		var comb = new Set(dbList.concat(feList));
		comb = Array.from(comb);
		for (var i = 0; i < comb.length; i++){
			var inDB = dbList.includes(comb[i]);
			var inFE = feList.includes(comb[i]);
			if (inDB && !inFE){
				response = await dbClient.deleteUserFromSubtask(comb[i], subID);
				success = success & (response.affectedRows == 1);
			}
			if (inFE && !inDB){
				response = await dbClient.addUserToSubtask(comb[i], subID);
				success = success & (response.affectedRows == 1);
			}
		}

		dbList = await dbClient.getFilesForSubtask(subID);
		feList = req.body.files;

		for (var i = 0; i < dbList.length; i++) {
			var file = dbList[i];
			var found = feList.find(function(ofile){
				return ofile.doc_id === file.doc_id && ofile.version === file.version;
			});
			if (found === undefined){
				response = await dbClient.deleteFileFromSubtask(file.doc_id, file.version, subID);
				success = success & (response.affectedRows == 1);
			}
		}
		for (var i = 0; i < feList.length; i++) {
			var file = feList[i];
			var found = dbList.find(function(ofile){
				return ofile.doc_id === file.doc_id && ofile.version === file.version;
			});
			if (found === undefined){
				response = await dbClient.addFileToSubtask(file.doc_id, file.version, subID);
				success = success & (response.affectedRows == 1);
			}
		}
		const data = await getTaskData(dbClient);
		res.json({
			success: success,
			data: data,
		})
	} catch (e) {
		console.log("editSubtask() promise rejection: " + e);
		res.json({ success: false,
			rejection: true });
	}
}

async function editSubtaskFiles(req, res, dbClient) {
	if (!validateEditSubtaskFiles(req)) {
		console.log("Invalid input in edit subtask.");
		res.json({ success: false,
			rejection: false });
		res.end();
		return;
	}
	try {
		var subID = req.body.subtask_id;
		var success = true;

		dbList = await dbClient.getFilesForSubtask(subID);
		feList = req.body.files;

		for (var i = 0; i < dbList.length; i++) {
			var file = dbList[i];
			var found = feList.find(function(ofile){
				return ofile.doc_id === file.doc_id && ofile.version === file.version;
			});
			if (found === undefined){
				response = await dbClient.deleteFileFromSubtask(file.doc_id, file.version, subID);
				success = success & (response.affectedRows == 1);
			}
		}
		for (var i = 0; i < feList.length; i++) {
			var file = feList[i];
			var found = dbList.find(function(ofile){
				return ofile.doc_id === file.doc_id && ofile.version === file.version;
			});
			if (found === undefined){
				response = await dbClient.addFileToSubtask(file.doc_id, file.version, subID);
				success = success & (response.affectedRows == 1);
			}
		}
		const data = await getTaskData(dbClient);
		res.json({
			success: success,
			data: data,
		})
	} catch (e) {
		console.log("editSubtaskFiles() promise rejection: " + e);
		res.json({ success: false,
			rejection: true });
	}
}

async function deleteTask(req, res, dbClient) {
	// No need to validate since task_id is not public
	try {
		var success = true;
		const subtasks = await dbClient.getSubtasks(req.body.task_id);
		for(var i = 0; i < subtasks.length; i++){
			var subID = subtasks[i].subtask_id;
			var responseWorks = await dbClient.deleteSubtaskFromWorks(subID);
			var responseSubs = await dbClient.deleteSubtaskFromSubtasks(subID);
			var responseFile = await dbClient.deleteSubtaskFileAssociation(subID);
			success = success && (responseWorks.affectedRows >= 0) && (responseSubs.affectedRows == 1) && (responseFile.affectedRows >= 0);
		}
		const response = await dbClient.deleteTask(req.body.task_id);
		success = success && (response.affectedRows == 1);
		const data = await getTaskData(dbClient);
		res.json({
			success: success,
			data: data
		});
	} catch(e) {
		console.log("deleteTask() promise rejection: " + e);
		res.json({ success: false,
			rejection: true });
	}
}

async function deleteSubtask(req, res, dbClient) {
	try {
		const subID = req.body.subtask_id;
		var responseWorks = await dbClient.deleteSubtaskFromWorks(subID);
		var responseSubs = await dbClient.deleteSubtaskFromSubtasks(subID);
		var responseFile = await dbClient.deleteSubtaskFileAssociation(subID);
		var success = responseSubs.affectedRows == 1;
		const data = await getTaskData(dbClient);
		res.json({
			success: success,
			data: data
		});
	} catch(e) {
		console.log("deleteSubtask() promise rejection: " + e);
		res.json({ success: false,
			rejection: true });
	}
}

async function markSubtask(req, res, dbClient) {
	try {
		var completed = req.body.completed == "true" ? 1 : 0;
		var current = await dbClient.getSubtask(req.body.subtask_id);
		var prevCompleted = current[0].priority_number == 1;
		if (!prevCompleted) {
			prevCompleted = true;
			var prev = await dbClient.getSubtasksWithStage(current[0].task_id, current[0].priority_number - 1);
			for (var i = 0; i < prev.length; i++) {
				var prevUsers = await dbClient.getUsersForSubtask(prev[i].subtask_id);
				for (var j = 0; j < prevUsers.length; j++) {
					if (prevUsers[j].completed == 0){
						prevCompleted = false;
						break;
					}
				}
				if (!prevCompleted) {
					break;
				}
			}
		}
		if (prevCompleted || completed == 0) {
			const response = await dbClient.markSubtask(req.session.cas.user, req.body.subtask_id, completed);
			var success = response.affectedRows == 1;
			const allUsers = await dbClient.getUsersForSubtask(req.body.subtask_id);
			var finished = true;
			for (var i = 0; i < allUsers.length; i++) {
				if(allUsers[i].completed == 0) {
					finished = false;
				}
			}
			await dbClient.setSubtaskEndTime(req.body.subtask_id, finished);
			const data = await getTaskData(dbClient);
			res.json({
				success: success,
				data: data,
			});
		} else {
			const data = await getTaskData(dbClient);
			res.json({
				data: data,
			})
		}
	} catch(e) {
		console.log("markSubtask() promise rejection: " + e);
		res.json({ success: false,
			rejection: true });
	}
}

async function markSubtaskAll(req, res, dbClient) {
	try {
		const users = await dbClient.getUsersForSubtask(req.body.subtask_id);
		var success = false;
		var completed = req.body.completed == "true" ? 1 : 0;
		for (var i = 0; i < users.length; i++) {
			var response = await dbClient.markSubtask(users[i].dir_id, req.body.subtask_id, completed);
			success = success || response.affectedRows == 1;
		}
		var response = await dbClient.setSubtaskEndTime(req.body.subtask_id, req.body.completed);
		const data = await getTaskData(dbClient);
		res.json({
			success: success,
			data: data,
		});
	} catch(e) {
		console.log("markSubtaskAll() promise rejection: " + e);
		res.json({ success: false,
			rejection: true });
	}
}

async function getSubtaskComments(req, res, dbClient) {
	try {
		const data = await dbClient.getSubtaskComments(req.query.id);
		res.json({ data: data });
	} catch(e) {
		console.log("getSubtaskComments() promise rejection: " + e);
		res.json({ success: false,
			rejection: true });
	}
}

async function addComment(req, res, dbClient) {
	try {
		const success = await dbClient.addComment(req.body.subtask_id, req.body.content, req.session.cas.user);
		const data = await dbClient.getSubtaskComments(req.body.subtask_id);
		res.json({
			success: success,
			data: data
		});
	} catch(e) {
		console.log("addComment() promise rejection: " + e);
		res.json({ success: false,
			rejection: true });
	}
}

exports.getTasks = getTasks;
exports.addTask = addTask;
exports.addSubtask = addSubtask;
exports.editTask = editTask;
exports.editSubtask = editSubtask;
exports.editSubtaskFiles = editSubtaskFiles;
exports.deleteTask = deleteTask;
exports.deleteSubtask = deleteSubtask;
exports.markSubtask = markSubtask;
exports.markSubtaskAll = markSubtaskAll;
exports.getSubtaskComments = getSubtaskComments;
exports.addComment = addComment;
