function initTasksPage(){
	initUserDisplay();
	checkPerms();
	updateTags();
	updateTasks();
}

function checkPerms() {
	if (window.currUser.role == "Admin") {
		document.getElementById("massReminderButton").style.display = "block";
		document.getElementById("addTaskButton").style.display = "block";
	}
}

function updateTasks(){
	var url = "/api/tasks"
	$.ajax({
		type: "GET",
		url: url,
		success: function(response){
			if (response.success || response.sucsess==undefined) {
				// should add identifier for initializing the page
				window.tasks = response.data;
				populateTasks(window.tasks);
			} else {
				if (response.rejection) {
					$('#taskPromiseRejectionModal').modal({
						show: true
					});
				} else {
					console.log("Error updateTasks(): This should not happen outside of init.");
				}
			}
		}
	});
}

function updateFiles() {
	var url = "/api/files";
	$.ajax({
		type: "GET",
		url: url,
		success: function(response) {
			if (response.success || response.success==undefined) {
				// should add identifier for initializing the page
				window.files = response.data;
				addSubtaskRow(false);
				populateSelectValues(document.getElementById("add-subtask-files"));
				populateSelectValues(document.getElementById("edit-subtask-files"));
				populateSelectValues(document.getElementById("change-files-subtask-files"));
			} else {
				if (response.rejection) {
					$('#taskPromiseRejectionModal').modal({
						show: true
					});
				} else {
					console.log("Error updateFiles(): This should never happen.");
				}
			}
		}
	});
}

function updateTags() {
	var url = "/api/users/tags";
	$.ajax({
		type: "GET",
		url: url,
		dataType: 'json',
		success: function(response) {
			if (response.success || response.success==undefined) {
				// should add identifier for initializing the page
				updateFiles();
				window.tags = response.data.tags;
				window.tagsMap = response.data.tagMap;
				window.userList = response.data.users;
				window.userIds = response.data.userIds;
				window.userMap = response.data.userMap;
			} else {
				if (response.rejection) {
					$('#taskPromiseRejectionModal').modal({
						show: true
					});
				} else {
					console.log("Error updateTags(): This should not happen outside of init.");
				}
			}
		}
	});
}

function populateTasks(tasks){
	var datedTasks = "";
	var undatedTasks = "";
	for (var i = 0; i < tasks.length; i++){
		var task = tasks[i];
		var formattedDate;
		if (task.due==undefined) {
			formattedDate = undefined;
		} else {
			var date = new Date(task.due);
			var month = date.getMonth() + 1;
			var minutes = (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes());
			formattedDate = month + "/" + date.getDate() + "/" + date.getFullYear() + " " + date.getHours() + ":" + minutes;
		}
		var taskStatus = (task.completed ? "task-complete" : "task-incomplete");
		var currTask = "<div class='card " + taskStatus + "'>";
		currTask += "<div class='card-header' id='heading" + i + "'>";
		currTask += "<h2 class='mb-0'>";
		currTask += "<button class='btn btn-link collapsed' type='button' data-toggle='collapse' data-target='#collapse" + i + "' aria-expanded='true' aria-controls='collapse" + i + "'>";
		if (formattedDate) {
			currTask += task.name + "<span class='badge badge-secondary ml-2'>" + formattedDate + "</span>";
			currTask += "</button></h2></div>";
			currTask += "<div id='collapse" + i + "' class='collapse' aria-labelledby='heading" + i + "' data-parent='#datedTaskAccordion'><div class='card-body'>";
		} else {
			currTask += task.name;
			currTask += "</button></h2></div>";
			currTask += "<div id='collapse" + i + "' class='collapse' aria-labelledby='heading" + i + "' data-parent='#undatedTaskAccordion'><div class='card-body'>";
		}
		currTask += task.description;
		currTask += "<table class='table table-bordered table-hover mt-3'>";
		currTask += "<thead class='thead-dark'><tr><th scope='col'>Subtask Name</th><th scope='col'>Description</th><th scope='col'>Stage</th><th scope='col'>Status</th><th scope='col'>Assigned To</th><th scope='col'>Files</th><th scope='col'>Mark Complete</th><th scope='col'>Actions</th>";
		currTask += "</tr></thead>";
		currTask += "<tbody>";
		var lastStageCompleted = false;
		var lastStage = 0;
		for (var j = 0; j < task.subtasks.length; j++) {
			var subtask = task.subtasks[j];
			var currSubtask = "<tr>";
			currSubtask += "<td>" + subtask.name + "</td>";
			currSubtask += "<td>" + subtask.description + "</td>";
			currSubtask += "<td>" + subtask.stage + "</td>";
			currSubtask += "<td>" + (subtask.completed ? "Completed" : "In Progress") + "</td>";
			currSubtask += "<td>";
			var userAssignedToSubtask = false;
			var userCompletedSubtask = false;
			for (var k = 0; k < subtask.assignedTo.length; k++) {
				var person = subtask.assignedTo[k];
				var currPerson = person.name + " (" + (person.completed ? "Completed" : "In Progress") + ")<br>";
				if (person.dir_id == window.currUser.dir_id) {
					currPerson = "<strong>" + currPerson + "</strong>";
					userAssignedToSubtask = true;
					userCompletedSubtask = person.completed;
				}
				currSubtask += currPerson;
			}
			currSubtask += "</td>";
			currSubtask += "<td>";
			for (var l = 0; l < subtask.files.length; l++) {
				var file = subtask.files[l];
				currSubtask += "<a href='/api/files/download?doc_id=" + file.doc_id + "&version=" + file.version + "'>" + file.name + "</a><br>"
			}
			currSubtask += "</td>";
			var adminString = "";
			if (window.currUser.role == "Admin") {
				if(!subtask.completed) {
					adminString = "<br><a href='#' onclick='markSubtaskAll(" + subtask.subtask_id + ", true)'>Mark Subtask Fully Complete</a>";
				} else {
					adminString = "<br><a href='#' onclick='markSubtaskAll(" + subtask.subtask_id + ", false)'>Mark Subtask Fully Incomplete</a>";
				}
			}
			if (userAssignedToSubtask) {
				if (lastStageCompleted || subtask.stage <= lastStage || j == 0) {
					if (userCompletedSubtask) {
						// make incomplete
						currSubtask += "<td><a href='#' onclick='updateSubtaskStatus(" + subtask.subtask_id + ", false)'>Mark Incomplete</a>" + adminString + "</td>";
					} else {
						// make complete
						currSubtask += "<td><a href='#' onclick='updateSubtaskStatus(" + subtask.subtask_id + ", true)'>Mark Complete</a>" + adminString + "</td>";
					}
				} else {
					if(userCompletedSubtask) {
						currSubtask += "<td><a href='#' onclick='updateSubtaskStatus(" + subtask.subtask_id + ", false)'>Mark Incomplete</a>" + adminString + "</td>";
					} else {
						currSubtask += "<td>Previous stages not completed</td>";
					}
				}
			} else {
				if (lastStageCompleted || subtask.stage <= lastStage || j == 0){
					currSubtask += "<td>You are not on this task" + adminString + "</td>";
				} else {
					currSubtask += "<td>You are not on this task</td>";
				}
			}
			currSubtask += "<td><a class='mr-2' href='#' data-toggle='modal' data-target='#subtaskCommentsModal' data-task='" + i + "' data-subtask='" + j + "'><i data-feather='message-circle'></i></a>";
			if (window.currUser.role == "Admin") {
				currSubtask += "<a class='mr-2' href='#' data-toggle='modal' data-target='#editSubtaskModal' data-task='" + i + "' data-subtask='" + j + "'><i data-feather='edit'></i></a></td>";
			} else {
				currSubtask += "<a class='mr-2' href='#' data-toggle='modal' data-target='#changeFilesSubtaskModal' data-task='" + i + "' data-subtask='" + j + "'><i data-feather='file'></i></a></td>";
			}
			currSubtask += "</tr>";
			currTask += currSubtask;
			if (subtask.completed) {
				lastStageCompleted = true;
			} else {
				lastStageCompleted = false;
			}
			lastStage = subtask.stage;
		}
		currTask += "</tbody>";
		currTask += "</table>";
		if (window.currUser.role == "Admin") {
			currTask += "<button type='button' class='btn btn-primary mr-2' data-target='#reminderModal' data-toggle='modal' data-task='" + i + "'>Remind</button>";
			currTask += "<button type='button' class='btn btn-primary mr-2' data-toggle='modal' data-target='#editTaskModal' data-task='" + i + "'>Edit Task</button>";
			currTask += "<button type='button' class='btn btn-primary mr-2' data-toggle='modal' data-target='#addSubtaskModal' data-task='" + i + "'>Add Subtask</button>";
		}
		currTask += "</div></div>"
		currTask += "</div>";
		if (formattedDate) {
			datedTasks += currTask;
		} else {
			undatedTasks += currTask;
		}
	}
	document.getElementById("datedTaskAccordion").innerHTML = datedTasks;
	document.getElementById("undatedTaskAccordion").innerHTML = undatedTasks;
	feather.replace();
	prepEditTaskModal();
	prepEditSubtaskModal();
	prepChangeFilesSubtaskModal();
	prepDeleteTaskModal();
	prepDeleteSubtaskModal();
	prepAddSubtaskModal();
	prepReminderModal();
	prepCommentsModal();
}

var task;

function prepEditTaskModal() {
	$('#editTaskModal').on('show.bs.modal', function(event) {
		var button = $(event.relatedTarget);
		var idx = button.data('task');

		task = window.tasks[idx];

		var modal = $(this);
		modal.find('.modal-body #edit-task-id').val(task.task_id);
		modal.find('.modal-body #edit-task-name').val(task.name);
		modal.find('.modal-body #edit-task-description').val(task.description);
		if (task.due==null) {
			modal.find('.modal-body #edit-task-due-date').val(null);
			modal.find('.modal-body #edit-task-due-time').val(null);
		} else {
			modal.find('.modal-body #edit-task-due-date').val(task.due.substring(0, 10));
			var datetime = new Date(task.due);
			var hours = datetime.getHours();
			var minutes = datetime.getMinutes();
			var time = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes);
			modal.find('.modal-body #edit-task-due-time').val(time);
		}
	});
}

var subtask;

function prepEditSubtaskModal() {
	$('#editSubtaskModal').on('show.bs.modal', function(event) {
		var button = $(event.relatedTarget);
		var i = button.data('task');
		var j = button.data('subtask');

		subtask = window.tasks[i].subtasks[j];

		var modal = $(this);
		modal.find('.modal-body #edit-subtask-id').val(subtask.subtask_id);
		modal.find('.modal-body #edit-subtask-name').val(subtask.name);
		modal.find('.modal-body #edit-subtask-description').val(subtask.description);
		modal.find('.modal-body #edit-subtask-stage').val(subtask.stage);

		var editBox = document.getElementById("edit-subtask-people");
		editBox.value = "";
		editBox.onkeyup = editSubtaskTextHandler;
		editBox.onblur = editSubtaskTextHandler;
		window.editSubtaskPersonList = subtask.assignedTo.map(x => x.dir_id);
		updateEditSubtaskListDisplay();
		var list = window.tags.concat(window.userList);
		autocomplete(editBox, list, editSubtaskTextHandler);

		var select = document.getElementById("edit-subtask-files");
		var opt;
		for (var i = 0; i < select.options.length; i++) {
			opt = select.options[i];
			for (var j = 0; j < subtask.files.length; j++) {
				var val = subtask.files[j].doc_id + "," + subtask.files[j].version;
				if (opt.value == val) {
					opt.selected = true;
				}
			}
		}
	});
}

function prepChangeFilesSubtaskModal() {
	$('#changeFilesSubtaskModal').on('show.bs.modal', function(event) {
		var button = $(event.relatedTarget);
		var i = button.data('task');
		var j = button.data('subtask');

		subtask = window.tasks[i].subtasks[j];

		var modal = $(this);
		modal.find('.modal-body #change-files-subtask-id').val(subtask.subtask_id);

		var select = document.getElementById("change-files-subtask-files");
		var opt;
		for (var i = 0; i < select.options.length; i++) {
			opt = select.options[i];
			for (var j = 0; j < subtask.files.length; j++) {
				var val = subtask.files[j].doc_id + "," + subtask.files[j].version;
				if (opt.value == val) {
					opt.selected = true;
				}
			}
		}
	});
}

function prepDeleteTaskModal() {
	$('#deleteTaskModal').on('show.bs.modal', function(event) {
		var modal = $(this);
		modal.find('.modal-body #delete-task-id').val(task.task_id);
		modal.find('.modal-body #delete-task-name').text(task.name);
	});
}

function prepDeleteSubtaskModal() {
	$('#deleteSubtaskModal').on('show.bs.modal', function(event) {
		var modal = $(this);
		modal.find('.modal-body #delete-subtask-id').val(subtask.subtask_id);
		modal.find('.modal-body #delete-subtask-name').text(subtask.name);
	});
}

function prepAddSubtaskModal() {
	$('#addSubtaskModal').on('show.bs.modal', function(event) {
		var button = $(event.relatedTarget);
		var idx = button.data('task');

		task = window.tasks[idx];

		var modal = $(this);
		modal.find('.modal-body #add-subtask-task-id').val(task.task_id);

		var box = document.getElementById("add-subtask-people");
		box.onkeyup = addSubtaskTextHandler;
		box.onblur = addSubtaskTextHandler;
		window.addSubtaskPersonList = [];
		updateAddSubtaskListDisplay();
		var list = window.tags.concat(window.userList);
		autocomplete(box, list, addSubtaskTextHandler);
	})
}

function markSubtaskAll(subtask_id, completed) {
	var url = "/api/tasks/markall";
	$.ajax({
		type: "PUT",
		url: url,
		data: {
			subtask_id: subtask_id,
			completed: completed
		},
		success: function(response) {
			if(response.success) {
				window.tasks = response.data;
				populateTasks(window.tasks);
			} else {
				if (response.rejection) {
					$('#taskPromiseRejectionModal').modal({
						show: true
					});
				} else {
					$('#taskNoAuthorizationModal').modal({
						show: true
					});
				}
			}
		}
	})
}

function updateSubtaskStatus(subtask_id, status) {
	var url = "/api/tasks/mark";
	$.ajax({
		type: "PUT",
		url: url,
		data: {
			subtask_id: subtask_id,
			completed: status
		},
		success: function(response) {
			if (response.success) {
				window.tasks = response.data;
				populateTasks(window.tasks);
			} else {
				if (response.rejection) {
					$('#taskPromiseRejectionModal').modal({
						show: true
					});
				} else {
					console.log("Error updateSubtaskStatus(): This should never happen.");
				}
			}
		}
	});
}

function downloadFiles(files){
	fileIDs = files.split(", ");
}

function addSubtaskRow(canDelete){
	var table = document.getElementById('subtask-table');
	var rowNum = table.rows.length;
	var row = table.insertRow();

	var subtask = row.insertCell();

	var inner = "<div class='container'><u>Subtask " + rowNum + "</u><div class='row'>";

	inner += "<div class='col'>";

	inner += "<div class='form-group'>" +
	"<label for='subtask-name-" + rowNum + "' class='col-form-label'>Subtask Name:</label>" +
	"<input type='text' class='form-control subtask-name' id='subtask-name-" + rowNum + "' pattern='^[a-zA-Z0-9\s]{1,50}$' required>" +
	"<div class='help-block'>Must contain no more than 50 alphanumeric or space characters.</div></div>";

	inner += "<div class='form-group'>" +
	"<label for='subtask-description-" + rowNum + "' class='col-form-label'>Description:</label>" +
	"<textarea class='form-control subtask-description' id='subtask-description-" + rowNum + "' pattern='^[a-zA-Z0-9\s,.!;?()\"\"]{0,500}$'></textarea>" + 
	"<div class='help-block'>Must contain no more than 500 alphanumeric, space, as well as special characters ,.!?;()\"\".</div></div>";

	inner += "<div class='form-group'>" +
	"<label for='subtask-stage-" + rowNum + "' class='col-form-label'>Stage:</label>" +
	"<input type='number' class='form-control subtask-stage' id='subtask-stage-" + rowNum + "' value='1' pattern='^[0-9]*[1-9]+[0-9]*$'>" +
	"<div class='help-block'>Must be a number greater than 0. Default value is 1.</div></div>";

	inner += "<div class='form-group'>" +
	"<label for='person-box" + rowNum + "' class='col-form-label'>Assigned To:</label>" +
	"<h5 class='list-holder' id='list-input"+ rowNum + "'></h5>" +
	"<div class='autocomplete'><input type='text' class='form-control subtask-people' id='person-box" + rowNum + "' onkeyup='personTextHandler(" + rowNum + ")' pattern='^[a-zA-Z0-9\s]{1,50}$' required></div>" +
	"<div class='help-block'>Must be a valid directory id or tag. Separate directory ids or tags by commas.</div>";

	inner += "</div></div><div class='col'>";

	//files select
	inner += "<div class='form-group'>" +
	"<label for='subtask-files-" + rowNum + "' class='col-form-label'>Files: <span class='small'>Files must be uploaded from files page first</span></label><br>" +
	"<select id='subtask-files-" + rowNum + "' class='custom-select subtask-files' multiple='multiple'>";

	inner += "</select>";

	inner += "</div>";

	inner += "</div></div>";

	if(canDelete){
		inner += "<div class='row'><div class='col-md-2 ml-auto'><button type='button' class='btn btn-primary' onclick='removeSubtaskRow("+ rowNum + ")'>Remove subtask</button></div></div>";
	}

	inner += "</div>";
	subtask.innerHTML=inner;
	populateSelectValues(document.getElementById("subtask-files-" + rowNum));
	var list = window.tags.concat(window.userList);
	autocomplete(document.getElementById("person-box" + rowNum), list, () => {personTextHandler(rowNum)});
	initList(rowNum);
}

function removeSubtaskRow(rowNum){
	var table = document.getElementById('subtask-table');
	table.rows[rowNum].innerHTML = "";
}

function addTask(){
	var name = document.getElementById("add-task-name").value;
	var description = document.getElementById("add-task-description").value;
	var dueDate = document.getElementById("add-task-due-date").value;
	var dueTime = document.getElementById("add-task-due-time").value;
	var dueDateTime;
	if (dueDate && dueTime) {
		dueDateTime = dueDate + " " + dueTime + ":00";
	} else if (dueDate) {
		dueDateTime = dueDate + " 00:00:00";
	} else if (dueTime) {
		var now = new Date();
		var month = now.getMonth() + 1;
		var date = now.getDate();
		if (month < 10) {
			month = "0" + month;
		}
		if (date < 10) {
			date = "0" + date;
		}
		var dueDate = now.getFullYear() + "-" + month + "-" + date;
		dueDateTime = dueDate + " " + dueTime + ":00";
	} else {
		dueDateTime = undefined;
	}

	var subNames = document.getElementsByClassName("subtask-name");
	var subDscrp = document.getElementsByClassName("subtask-description");
	var subStage = document.getElementsByClassName("subtask-stage");
	var subPeopleInput = document.getElementsByClassName("subtask-people");
	var subFiles = document.getElementsByClassName("subtask-files");

	var data = {
		name: name,
		description: description,
		due: dueDateTime
	}

	var subtasks = [];
	for (var i = 0; i < subNames.length; i++){
		if (subPeopleInput[i].value != "") {
			document.getElementsByClassName("subtask-people")[i].value += ",";
			personTextHandler(i);
		}

		subtasks[i] = {
			name: subNames[i].value,
			description: subDscrp[i].value,
			stage: parseInt(subStage[i].value),
			assignedTo: window.personInputList[i],
			files: getSelectValues(subFiles[i]),
		};
	}

	data.subtasks = subtasks;
	console.log(data);

	var url = "/api/tasks";
	$.ajax({
		type: "POST",
		url: url,
		contentType: 'application/json',
		data: JSON.stringify(data),
		success: function(response) {
			if (response.success) {
				clearAddTaskForm();
				window.tasks = response.data;
				populateTasks(window.tasks);
			} else {
				if (response.rejection) {
					$('#taskPromiseRejectionModal').modal({
						show: true
					});
				} else {
					$('#invalidTaskInputModal').modal({
						show: true
					});
				}
			}
		}
	});
}

function addValidate() {
	var name = document.getElementById('add-task-name').value;
	var description = document.getElementById('add-task-description').value;
	var dueDate = document.getElementById('add-task-due-date').value;
	var dueTime = document.getElementById('add-task-due-time').value;
	
	var subNames = document.getElementsByClassName("subtask-name");
	var subDscrp = document.getElementsByClassName("subtask-description");
	var subStage = document.getElementsByClassName("subtask-stage");
	var subPeopleInput = document.getElementsByClassName("subtask-people");
	var subFiles = document.getElementsByClassName("subtask-files");

	var nameSpecial = new RegExp(/^[a-zA-Z0-9\s]{1,50}$/);
	var dateSpecial = new RegExp(/^$|^([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))$/);
	var timeSpecial = new RegExp(/^$|^([01]\d|2[0-3]):?([0-5]\d)$/);
	var stageSpecial = new RegExp(/^[0-9]*$/);
	var descrSpecial = new RegExp(/^[a-zA-Z0-9\s,.!;?()""]{0,500}$/);

	var form = document.querySelector('#addTaskForm');
	form.reportValidity();
	
	if (name==undefined || description==undefined) {
		console.log("add-task-undef");
		return false;
	}
	if (name.length==0 || description.length>500) {
		console.log("add-task-noname/description-too-long");
		return false;
	}
	if (!nameSpecial.test(name) || !dateSpecial.test(dueDate) || !timeSpecial.test(dueTime) || !descrSpecial.test(description)) {
		console.log("add-task-illegalchar");
		return false;
	}
	if (subNames==undefined || subDscrp==undefined || subStage==undefined || subPeopleInput==undefined || subFiles==undefined) {
		console.log("add-subtaskraw-undef");
		return false;
	}
	if (subNames.length != subDscrp.length || subNames.length != subStage.length || subNames.length != subPeopleInput.length ||
		subNames.length != subFiles.length) {
			console.log("add-subtaskraw-badlength");
			return false;
	}
	for (var i=0; i<subNames.length; i++) {
		if (subStage[i].value.length == 0 || subStage[i].value == undefined || subStage[i].value <= 0) {
			subStage[i].value = 1;
		}

		if (subNames[i].value==undefined || subDscrp[i].value==undefined || subStage[i].value==undefined ||
			subPeopleInput[i].value==undefined || subFiles[i].value==undefined) {
			console.log("add-subtask-undef "+i);
			return false;
		}
		if (subNames[i].value.length==0 || subStage[i].value.length==0) {
			console.log("add-subtask-noname "+i);
			return false;
		}
		if (!nameSpecial.test(subNames[i].value) || !stageSpecial.test(subStage[i].value)) {
			console.log("add-subtask-illegalchar "+i);
			return false;
		}
	}

	addTask();
	$('#addTaskModal').modal("hide");
}

function populateSelectValues(select) {
	var inner = "";
	if (window.files==undefined) {
		select.innerHTML = inner;
		return;
	}
	for (var i = window.files.length-1; i >= 0; i--) {
		if (!window.files[i].deleted) {
			if (window.files[i].parent === "uploads") {
				inner += "<optgroup label='" + window.files[i].name + "'>";
			} else {
				inner += "<optgroup label='" + window.files[i].parent + window.files[i].name + "'>";
			}
			if (window.files[i].folder) {
				inner += "<option value='" + window.files[i].doc_id + "," + window.files[i].version[0].version + "'>Entire Folder</option>";
			} else {
				for (var j = 0; j < window.files[i].version.length; j++) {
					if (!window.files[i].version[j].deleted) {
						inner += "<option value='" + window.files[i].doc_id + "," + window.files[i].version[j].version + "'>Version " + window.files[i].version[j].version + "</option>";
					}
				}
			}
			inner += "</optgroup>";
		}
	}
	select.innerHTML = inner;
}

function getSelectValues(select) {
	var result = [];
	var options = select && select.options;
	var opt;

	for (var i=0, iLen=options.length; i<iLen; i++) {
		opt = options[i];
		if (opt.selected) {
			indexes = opt.value.split(",");
			doc_id = parseInt(indexes[0]);
			version = parseInt(indexes[1]);
			result.push({
				doc_id: doc_id,
				version: version
			});
		}
	}
	return result;
}

function getSelectValuesUsers(select) {
	var result = [];
	var options = select && select.options;
	var opt;

	for (var i=0, iLen=options.length; i<iLen; i++) {
		opt = options[i];
		if (opt.selected) {
			result.push(opt.value);
		}
	}
	return result;
}

function clearAddTaskForm() {
	document.getElementById("add-task-name").value = "";
	document.getElementById("add-task-description").value = "";
	document.getElementById("add-task-due-date").value = "";
	document.getElementById("add-task-due-time").value = "";
	document.getElementById("subtask-table").innerHTML = "";
	initGlobalList();
	addSubtaskRow(false);
}

function editTask() {
	var task_id = document.getElementById("edit-task-id").value;
	var name = document.getElementById("edit-task-name").value;
	var description = document.getElementById("edit-task-description").value;
	var dueDate = document.getElementById("edit-task-due-date").value;
	var dueTime = document.getElementById("edit-task-due-time").value;
	var dueDateTime;
	if (dueDate && dueTime) {
		dueDateTime = dueDate + " " + dueTime + ":00";
	} else if (dueDate) {
		dueDateTime = dueDate + " 00:00:00";
	} else if (dueTime) {
		var now = new Date();
		var month = now.getMonth() + 1;
		var date = now.getDate();
		if (month < 10) {
			month = "0" + month;
		}
		if (date < 10) {
			date = "0" + date;
		}
		var dueDate = now.getFullYear() + "-" + month + "-" + date;
		dueDateTime = dueDate + " " + dueTime + ":00";
	} else {
		dueDateTime = undefined;
	}

	var url = "/api/tasks/edit";
	$.ajax({
		type: "POST",
		url: url,
		data: {
			task_id: task_id,
			name: name,
			description: description,
			due: dueDateTime
		},
		success: function(response) {
			if (response.success) {
				window.tasks = response.data;
				populateTasks(window.tasks);
			} else {
				if (response.rejection) {
					$('#taskPromiseRejectionModal').modal({
						show: true
					});
				} else {
					$('#invalidTaskInputModal').modal({
						show: true
					});
				}
			}
		}
	});
}

function editValidate() {
	var name = document.getElementById('edit-task-name').value;
	var description = document.getElementById("edit-task-description").value;
	var dueDate = document.getElementById('edit-task-due-date').value;
	var dueTime = document.getElementById('edit-task-due-time').value;

	var nameSpecial = new RegExp(/^[a-zA-Z0-9\s]{1,50}$/);
	var dateSpecial = new RegExp(/^$|^([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))$/);
	var timeSpecial = new RegExp(/^$|^([01]\d|2[0-3]):?([0-5]\d)$/);
	var descrSpecial = new RegExp(/^[a-zA-Z0-9\s,.!;?()""]{0,500}$/);

	var form = document.querySelector('#editTaskForm');
	form.reportValidity();

	if (name==undefined || description==undefined) {
		console.log("edit-task-no1");
		return false;
	}
	if (name.length==0 || description.length>500) {
		console.log("edit-task-no2");
		return false;
	}
	if (!nameSpecial.test(name) || !dateSpecial.test(dueDate) || !timeSpecial.test(dueTime) || !descrSpecial.test(description)) {
		console.log("edit-task-no3");
		return false;
	}

	editTask();
	$('#editTaskModal').modal("hide");
}

function editSubtask() {
	var subtask_id = document.getElementById("edit-subtask-id").value;
	var name = document.getElementById("edit-subtask-name").value;
	var description = document.getElementById("edit-subtask-description").value;
	var stage = document.getElementById("edit-subtask-stage").value;
	var peopleInput = document.getElementById("edit-subtask-people").value;
	if (peopleInput != "") {
		document.getElementById("edit-subtask-people").value += ",";
		editSubtaskTextHandler();
	}
	var people = window.editSubtaskPersonList;
	var files = document.getElementById("edit-subtask-files");
	var data = {
		subtask_id: subtask_id,
		name: name,
		description: description,
		stage: stage,
		assignedTo: people,
		files: getSelectValues(files)
	}
	var url = "/api/tasks/subtasks/edit";
	$.ajax({
		type: "POST",
		url: url,
		contentType: 'application/json',
		data: JSON.stringify(data),
		success: function(response) {
			populateSelectValues(document.getElementById("edit-subtask-files"));
			if (response.success) {
				window.tasks = response.data;
				populateTasks(window.tasks);
			} else {
				if (response.rejection) {
					$('#taskPromiseRejectionModal').modal({
						show: true
					});
				} else {
					$('#invalidTaskInputModal').modal({
						show: true
					});
				}
			}
		}
	});
}

function editSubtaskValidate() {
	var name = document.getElementById('edit-subtask-name').value;
   	var description = document.getElementById("edit-subtask-description").value;
	var stage = document.getElementById('edit-subtask-stage').value;

	var nameSpecial = new RegExp(/^[a-zA-Z0-9\s]{1,50}$/);
	var number = new RegExp(/^[0-9]*[1-9]+[0-9]*$/);
	var descrSpecial = new RegExp(/^[a-zA-Z0-9\s,.!;?()""]{0,500}$/);

	if (stage.length == 0 || stage == undefined || stage <= 0) {
		document.getElementById('edit-subtask-stage').value = 1;
		stage = 1;
	}

	var form = document.querySelector('#editSubtaskForm');
	form.reportValidity();

	if (name==undefined || description==undefined || stage==undefined) {
		console.log("edit-subtask-no1");
		return false;
	}
	if (name.length==0 || description > 500) {
		console.log("edit-subtask-no2");
		return false;
	}
	if (!nameSpecial.test(name) || !number.test(stage) || !descrSpecial.test(description)) {
		console.log("edit-subtask-no3");
		return false;
	}

	editSubtask();
	$('#editSubtaskModal').modal("hide");
}

function changeFilesSubtask() {
	var subtask_id = document.getElementById("change-files-subtask-id").value;
	var files = document.getElementById("change-files-subtask-files");
	var data = {
		subtask_id: subtask_id,
		files: getSelectValues(files)
	}
	var url = "/api/tasks/subtasks/files/edit";
	$.ajax({
		type: "POST",
		url: url,
		contentType: 'application/json',
		data: JSON.stringify(data),
		success: function(response) {
			populateSelectValues(document.getElementById("change-files-subtask-files"));
			if (response.success) {
				window.tasks = response.data;
				populateTasks(window.tasks);
			} else {
				if (response.rejection) {
					$('#taskPromiseRejectionModal').modal({
						show: true
					});
				} else {
					console.log("Error changeFilesSubtask(): This should never happen.");
				}
			}
		}
	});
}

function deleteTask() {
	var task_id = document.getElementById("delete-task-id").value;
	var url = "/api/tasks";
	$.ajax({
		type: "DELETE",
		url: url,
		data: {
			task_id: task_id
		},
		success: function(response) {
			if (response.success) {
				window.tasks = response.data;
				populateTasks(window.tasks);
			} else {
				if (response.rejection) {
					$('#taskPromiseRejectionModal').modal({
						show: true
					});
				} else {
					console.log("Error deleteTask(): This should never happen.");
				}
			}
		}
	});
}

function deleteSubtask() {
	var subtask_id = document.getElementById("delete-subtask-id").value;
	var url = "/api/tasks/subtasks";
	$.ajax({
		type: "DELETE",
		url: url,
		data: {
			subtask_id: subtask_id
		},
		success: function(response) {
			if (response.success) {
				window.tasks = response.data;
				populateTasks(window.tasks);
			} else {
				if (response.rejection) {
					$('#taskPromiseRejectionModal').modal({
						show: true
					});
				} else {
					console.log("Error deleteSubtask(): This should never happen.");
				}
			}
		}
	});
}

function addSubtask() {
	var task_id = document.getElementById("add-subtask-task-id").value;
	var name = document.getElementById("add-subtask-name").value;
	var description = document.getElementById("add-subtask-description").value;
	var stage = document.getElementById("add-subtask-stage").value;
	var peopleInput = document.getElementById("add-subtask-people").value;
	if (peopleInput != "") {
		document.getElementById("add-subtask-people").value += ",";
		addSubtaskTextHandler();
	}
	var people = window.addSubtaskPersonList;
	var files = document.getElementById("add-subtask-files");
	var data = {
		task_id: task_id,
		name: name,
		description: description,
		stage: stage,
		assignedTo: people,
		files: getSelectValues(files)
	}
	var url = "/api/tasks/subtasks";
	$.ajax({
		type: "POST",
		url: url,
		contentType: 'application/json',
		data: JSON.stringify(data),
		success: function(response) {
			if (response.success) {
				clearAddSubtaskForm();
				window.tasks = response.data;
				populateTasks(window.tasks);
			} else {
				if (response.rejection) {
					$('#taskPromiseRejectionModal').modal({
						show: true
					});
				} else {
					$('#invalidTaskInputModal').modal({
						show: true
					});
				}
			}
		}
	});
}

function addSubtaskValidate() {
	var name = document.getElementById('add-subtask-name').value;
	var description = document.getElementById("add-subtask-description").value;
	var stage = document.getElementById('add-subtask-stage').value;

	var nameSpecial = new RegExp(/^[a-zA-Z0-9\s]{1,50}$/);
	var number = new RegExp(/[0-9]*[1-9]+[0-9]*$/);
	var descrSpecial = new RegExp(/^[a-zA-Z0-9\s,.!;?()""]{0,500}$/);

	if (stage.length == 0 || stage == undefined || stage <= 0) {
		document.getElementById('add-subtask-stage').value = 1;
		stage = 1;
	}

	var form = document.querySelector('#addSubtaskForm');
	form.reportValidity();

	if (name==undefined || description==undefined || stage==undefined) {
		console.log("add-subtask-no1");
		return false;
	}
	if (name.length==0 || description.length > 500) {
		console.log("add-subtask-no2");
		return false;
	}
	if (!nameSpecial.test(name) || !number.test(stage) || !descrSpecial.test(description)) {
		console.log("add-subtask-no3");
		return false;
	}

	addSubtask();
	$('#addSubtaskModal').modal("hide");

}

function clearAddSubtaskForm() {
	document.getElementById("add-subtask-name").value = "";
	document.getElementById("add-subtask-description").value = "";
	document.getElementById("add-subtask-stage").value = "";
	document.getElementById("add-subtask-people").value = "";
	window.addSubtaskPersonList = [];
	updateAddSubtaskListDisplay();
	populateSelectValues(document.getElementById("add-subtask-files"));
}

var task;

function prepReminderModal() {
	$('#reminderModal').on('show.bs.modal', function(event) {
		var button = $(event.relatedTarget);
		var idx = button.data('task');

		task = window.tasks[idx];
		var modal = $(this);
		modal.find('.modal-body #reminder-task-name').text(task.name);
	});
}

function sendReminder() {
	var id = task.task_id;
	var name = task.name;
	var url = "/sendreminder";
	$.ajax({
		type: "POST",
		url: url,
		data: {
			id: id,
			name: name
		},
		success: function(response) {
			console.log(response);
		}
	});
}

function sendMassReminder() {
	var url = "/sendmassreminder";
	$.ajax({
		type: "POST",
		url: url,
		success: function(response) {
			console.log(response);
		}
	});
}

function prepCommentsModal() {
	$('#subtaskCommentsModal').on('show.bs.modal', function(event) {
		var button = $(event.relatedTarget);
		var i = button.data('task');
		var j = button.data('subtask');

		subtask = window.tasks[i].subtasks[j];
		var modal = $(this);
		modal.find('.modal-header #subtaskCommentsModalLabel').html(subtask.name + " Comments");
		modal.find('.modal-body #comment-subtask-id').text(subtask.subtask_id);

		var url = "/api/tasks/comments/subtask?id=" + subtask.subtask_id;

		$.ajax({
			type: "GET",
			url: url,
			success: function(response){
				window.comments = response.data;
				populateComments(window.comments);
			}
		});
	})
}

function populateComments(comments) {
	var commentsHTML = "";
	commentsHTML += "<ul class='list-group'>"
	for (var i = 0; i < comments.length; i++) {
		var comment = comments[i];
		var date = new Date(comment.time_stamp);
		var month = date.getMonth() + 1;
		var minutes = (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes());
		var formattedDate = month + "/" + date.getDate() + "/" + date.getFullYear() + " " + date.getHours() + ":" + minutes;
		commentsHTML += "<li class='list-group-item'>";
		commentsHTML += "<b>" + comment.creator + "</b>";
		commentsHTML += " <small><i>" + formattedDate + "</i></small><br>";
		commentsHTML +=	comment.content + "</li>";
	}
	commentsHTML += "</ul>";
	document.getElementById("subtask-comment-content").innerHTML = commentsHTML;
}

function postComment() {
	var subtask_id = document.getElementById("comment-subtask-id").innerHTML;
	var content = document.getElementById("add-subtask-comment").value;
	var url = "/api/tasks/comments";
	$.ajax({
		type: "POST",
		url: url,
		data: {
			subtask_id: subtask_id,
			content: content
		},
		success: function(response) {
			console.log(response);
			document.getElementById("add-subtask-comment").value = "";
			window.comments = response.data;
			populateComments(window.comments);
		}
	});
}

// LIST INPUT FUNCTIONS

function initGlobalList(){
	window.personInputList = [];
}

function initList(row) {
	if(window.personInputList == null){
		initGlobalList();
	}
	window.personInputList[row] = [];
}

function personTextHandler(row) {
	var box = document.getElementById('person-box' + row);
	if (box.value.charAt(box.value.length - 1) == ',' || box.value.charAt(box.value.length - 1) == '\n') {
		var name = box.value.substring(0, box.value.length - 1);
		if (name.length > 0) {
			if (window.userList.includes(name)) {
				addToPersonList(window.userMap[name], row);
			} else if (window.userIds.includes(name)) {
				addToPersonList(name, row);
			} else if (window.tags.includes(name)) {
				var users = window.tagsMap[name];
				for (var i = 0; i < users.length; i++) {
					addToPersonList(users[i], row);
				}
			}
		}
		box.value = "";
	}
}

function addToPersonList(name, row) {
	if (!window.personInputList[row].includes(name)) {
		window.personInputList[row].push(name);
	}
	updateListDisplay();
}

function removeFromPersonList(name, row) {
	for (var i = 0; i < window.personInputList[row].length; i++) {
		if (window.personInputList[row][i] == name) {
			window.personInputList[row].splice(i, 1);
		}
	}
	updateListDisplay();
}

function removeFromPersonListIdx(idx, row) {
	window.personInputList[row].splice(idx, 1);
	updateListDisplay();
}

function updateListDisplay() {
	for (var i = 0; i < window.personInputList.length; i++){
		var holder = document.getElementById("list-input"+i);
		if(holder != null){
			holder.innerHTML = "";
			for (var j = 0; j < window.personInputList[i].length; j++) {
				holder.innerHTML += "<span class='badge badge-secondary list-item'>" + window.personInputList[i][j] + "<span aria-hidden='true' class='list-close'><a href='javascript:void(0)' onclick='removeFromPersonListIdx(" + j +","+ i + ")'>&times;</a></span></span> ";
			}
		}
	}
}

function editSubtaskTextHandler() {
	var box = document.getElementById("edit-subtask-people");
	if (box.value.charAt(box.value.length - 1) == ',' || box.value.charAt(box.value.length - 1) == '\n') {
		var name = box.value.substring(0, box.value.length - 1);
		if (name.length > 0) {
			if (window.userList.includes(name)) {
				addToEditSubtaskList(window.userMap[name]);
			} else if (window.userIds.includes(name)) {
				addToEditSubtaskList(name);
			} else if (window.tags.includes(name)) {
				var users = window.tagsMap[name];
				for (var i = 0; i < users.length; i++) {
					addToEditSubtaskList(users[i]);
				}
			}
		}
		box.value = "";
	}
}

function addToEditSubtaskList(name) {
	if (!window.editSubtaskPersonList.includes(name)) {
		window.editSubtaskPersonList.push(name);
	}
	updateEditSubtaskListDisplay();
}

function removeFromEditSubtaskListIdx(tagIdx) {
	window.editSubtaskPersonList.splice(tagIdx, 1);
	updateEditSubtaskListDisplay();
}

function updateEditSubtaskListDisplay() {
	var holder = document.getElementById("edit-subtask-people-list-holder");
	holder.innerHTML = "";
	for (var i = 0; i < window.editSubtaskPersonList.length; i++) {
		holder.innerHTML += "<span class='badge badge-secondary list-item'>" + window.editSubtaskPersonList[i] + "<span aria-hidden='true' class='list-close'><a href='javascript:void(0)' onclick='removeFromEditSubtaskListIdx(" + i + ")'>&times;</a></span></span> ";
	}
}

function addSubtaskTextHandler() {
	var box = document.getElementById("add-subtask-people");
	if (box.value.charAt(box.value.length - 1) == ',' || box.value.charAt(box.value.length - 1) == '\n') {
		var name = box.value.substring(0, box.value.length - 1);
		if (name.length > 0) {
			if (window.userList.includes(name)) {
				addToAddSubtaskList(window.userMap[name]);
			} else if (window.userIds.includes(name)) {
				addToAddSubtaskList(name);
			} else if (window.tags.includes(name)) {
				var users = window.tagsMap[name];
				for (var i = 0; i < users.length; i++) {
					addToAddSubtaskList(users[i]);
				}
			}
		}
		box.value = "";
	}
}

function addToAddSubtaskList(name) {
	if (!window.addSubtaskPersonList.includes(name)) {
		window.addSubtaskPersonList.push(name);
	}
	updateAddSubtaskListDisplay();
}

function removeFromAddSubtaskListIdx(tagIdx) {
	window.addSubtaskPersonList.splice(tagIdx, 1);
	updateAddSubtaskListDisplay();
}

function updateAddSubtaskListDisplay() {
	var holder = document.getElementById("add-subtask-people-list-holder");
	holder.innerHTML = "";
	for (var i = 0; i < window.addSubtaskPersonList.length; i++) {
		holder.innerHTML += "<span class='badge badge-secondary list-item'>" + window.addSubtaskPersonList[i] + "<span aria-hidden='true' class='list-close'><a href='javascript:void(0)' onclick='removeFromAddSubtaskListIdx(" + i + ")'>&times;</a></span></span> ";
	}
}


function autocomplete(inp, arr, listHandlerFunc) {
	/*the autocomplete function takes two arguments,
	the text field element and an array of possible autocompleted values:*/
	var currentFocus;
	/*execute a function when someone writes in the text field:*/
	inp.addEventListener("input", function(e) {
		var a, b, i, val = this.value;
		/*close any already open lists of autocompleted values*/
		closeAllLists();
		if (!val) { return false;}
		currentFocus = -1;
		/*create a DIV element that will contain the items (values):*/
		a = document.createElement("DIV");
		a.setAttribute("id", this.id + "autocomplete-list");
		a.setAttribute("class", "autocomplete-items");
		/*append the DIV element as a child of the autocomplete container:*/
		this.parentNode.appendChild(a);
		/*for each item in the array...*/
		for (i = 0; i < arr.length; i++) {
			/*check if the item starts with the same letters as the text field value:*/
			if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
				/*create a DIV element for each matching element:*/
				b = document.createElement("DIV");
				/*make the matching letters bold:*/
				b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
				b.innerHTML += arr[i].substr(val.length);
				if (window.tags.includes(arr[i])) {
					b.innerHTML += " (tag)";
				} else if (window.userMap[arr[i]]) {
					b.innerHTML += " (" + window.userMap[arr[i]] + ")";
				}
				/*insert a input field that will hold the current array item's value:*/
				b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
				/*execute a function when someone clicks on the item value (DIV element):*/
					b.addEventListener("click", function(e) {
					/*insert the value for the autocomplete text field:*/
					inp.value = this.getElementsByTagName("input")[0].value + ",";
					listHandlerFunc();
					/*close the list of autocompleted values,
					(or any other open lists of autocompleted values:*/
					closeAllLists();
				});
				a.appendChild(b);
			}
		}
	});
	/*execute a function presses a key on the keyboard:*/
	inp.addEventListener("keydown", function(e) {
		var x = document.getElementById(this.id + "autocomplete-list");
		if (x) x = x.getElementsByTagName("div");
		if (e.keyCode == 40) {
			/*If the arrow DOWN key is pressed,
			increase the currentFocus variable:*/
			currentFocus++;
			/*and and make the current item more visible:*/
			addActive(x);
		} else if (e.keyCode == 38) { //up
			/*If the arrow UP key is pressed,
			decrease the currentFocus variable:*/
			currentFocus--;
			/*and and make the current item more visible:*/
			addActive(x);
		} else if (e.keyCode == 13) {
			/*If the ENTER key is pressed, prevent the form from being submitted,*/
			e.preventDefault();
			if (currentFocus > -1) {
				/*and simulate a click on the "active" item:*/
				if (x) x[currentFocus].click();
			}
		}
	});
	function addActive(x) {
		/*a function to classify an item as "active":*/
		if (!x) return false;
		/*start by removing the "active" class on all items:*/
		removeActive(x);
		if (currentFocus >= x.length) currentFocus = 0;
		if (currentFocus < 0) currentFocus = (x.length - 1);
		/*add class "autocomplete-active":*/
		x[currentFocus].classList.add("autocomplete-active");
	}
	function removeActive(x) {
		/*a function to remove the "active" class from all autocomplete items:*/
		for (var i = 0; i < x.length; i++) {
			x[i].classList.remove("autocomplete-active");
		}
	}
	function closeAllLists(elmnt) {
		/*close all autocomplete lists in the document,
		except the one passed as an argument:*/
		var x = document.getElementsByClassName("autocomplete-items");
		for (var i = 0; i < x.length; i++) {
			if (elmnt != x[i] && elmnt != inp) {
				x[i].parentNode.removeChild(x[i]);
			}
		}
	}
	/*execute a function when someone clicks in the document:*/
	document.addEventListener("click", function (e) {
		closeAllLists(e.target);
	});
}
