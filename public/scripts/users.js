function initUsersPage() {
	initUserDisplay();
	initTagsList();
	checkPerms();
	updateStatistics();
	updateUsers();
}

function checkPerms() {
	if (window.currUser.role == "Admin") {
		document.getElementById("addUserButton").style.display = "block";
	}
	usersHeading = "<tr>";
	usersHeading += "<th scope='col'>Name</th>";
	usersHeading += "<th scope='col'>Directory ID</th>";
	usersHeading += "<th scope='col'>Email</th>";
	usersHeading += "<th scope='col'>Role</th>";
	usersHeading += "<th scope='col'>Tags</th>";
	if (window.currUser.role == "Admin") {
		usersHeading += "<th scope='col'>Actions</th>";
	}
	usersHeading += "</tr>";
	document.getElementById("users-heading").innerHTML = usersHeading;
}

function updateUsers() {
	var url = "/api/users";
	$.ajax({
		type: "GET",
		url: url,
		dataType: 'json',
		success: function(response) {
			if (response.success) {
				window.users = response.data;
				populateUsers(response.data);
			} else {
				if (response.rejection) {
					$('#userPromiseRejectionModal').modal({
						show: true
					});
				} else {
					console.log("Error updateUsers() : This should never happen.");
				}
			}
		}
	});
}

function updateStatistics() {
	var url = "/api/users/stats";
	$.ajax({
		type: "GET",
		url: url,
		dataType: 'json',
		success: function(response) {
			if (response.success) {
				window.stats = response.data;
				console.log(window.stats)
			} else {
				if (response.rejection) {
					$('#userPromiseRejectionModal').modal({
						show: true
					});
				} else {
					console.log("Error updateStatistics() : This should never happen.");
				}
			}
		}
	});
}

var numAdmin = 0;

function populateUsers(users) {
	numAdmin = 0;
	var allUsers = "";
	for (var i = 0; i < users.length; i++) {
		if (users[i].role == "Admin") {
			numAdmin += 1;
		}
		var currUser = "<tr>";
		currUser += "<td>" + users[i].name + "</td>";
		currUser += "<td>" + users[i].dir_id + "</td>";
		currUser += "<td>" + users[i].email + "</td>";
		currUser += "<td>" + users[i].role + "</td>";
		currUser += "<td class='tags'>" + users[i].tags.replace(/\,/g, ", ") + "</td>";
		if (window.currUser.role == "Admin") {
			currUser += "<td><a class='mr-2' href='#' data-toggle='modal' data-target='#userStatisticsModal' data-user='" + i + "'><i data-feather='bar-chart-2'></i></a>";
			currUser += "<a class='mr-2' href='#' data-toggle='modal' data-target='#editUserModal' data-user='" + i + "'><i data-feather='edit'></i></a></td>";
		}
		currUser += "</tr>";
		allUsers += currUser;3

	}
	document.getElementById("users-contain").innerHTML = allUsers;
	feather.replace();
	prepEditUserModal();
	prepDeleteUserModal();
	prepUserStatisticsModal();
}

var user;

function prepEditUserModal() {
	$('#editUserModal').on('show.bs.modal', function(event) {
		var button = $(event.relatedTarget);
		var idx = button.data('user');

		user = window.users[idx];

		if (numAdmin == 1 && user.role == "Admin") {
			document.getElementById("edit-user-role").disabled = true;
		} else {
			document.getElementById("edit-user-role").disabled = false;
		}

		var modal = $(this);
		modal.find('.modal-body #edit-user-id').val(user.dir_id);
		modal.find('.modal-body #edit-user-name').val(user.name);
		modal.find('.modal-body #edit-user-email').val(user.email);
		modal.find('.modal-body #edit-user-role').val(user.role);
		$('#edit-user-role').selectpicker('refresh');
		// modal.find('.modal-body #edit-user-course').val(user.course);
		modal.find('.modal-body #edit-user-tags').val("");
		window.editTagsInputList = user.tags.split(",");
		updateEditTagListDisplay();
	});
}

function prepDeleteUserModal() {
	$('#deleteUserModal').on('show.bs.modal', function(event) {
		var modal = $(this);
		modal.find('.modal-body #delete-user-id').text(user.dir_id);
	});
}

function prepUserStatisticsModal() {
	$('#userStatisticsModal').on('show.bs.modal', function(event) {
		var button = $(event.relatedTarget);
		var idx = button.data('user');

		user = window.users[idx];
		stats = window.stats;
		userSubtasks = stats[user.dir_id];

		var todayDate = new Date();
		var liveSubtasks = 0;
		var completedLiveSubtasks = 0;
		var lateSubtasks = 0;
		for (var i = 0; i < userSubtasks.length; i++) {
			if (userSubtasks[i].due_date != null) {
				var dueDate = new Date(userSubtasks[i].due_date);
				if (todayDate.getTime() > dueDate.getTime()) {
					if (!userSubtasks[i].completed) {
						liveSubtasks += 1;
						lateSubtasks += 1;
					}
				} else {
					liveSubtasks += 1;
					if (userSubtasks[i].completed) {
						completedLiveSubtasks += 1;
					}
				}
			}
		}

		var progress = completedLiveSubtasks + "/" + liveSubtasks;

		var modal = $(this);
		modal.find('.modal-header #userStatisticsModalLabel').html(user.name);
		modal.find('.modal-body #num-live-tasks').text("Number of Live Subtasks: " + liveSubtasks);
		modal.find('.modal-body #live-tasks-progress').text("Progress on Live Subtasks: " + progress);
		modal.find('.modal-body #num-late-tasks').text("Number of Late Subtasks: " + lateSubtasks);
	});
}

function addUser() {
	var id = document.getElementById("add-user-id").value;
	var name = document.getElementById("add-user-name").value;
	var email = document.getElementById("add-user-email").value;
	var role = document.getElementById("add-user-role").value;
	// var course = document.getElementById("add-user-course").value;
	var tagInput = document.getElementById("add-user-tags").value;
	if (tagInput != "") {
		window.addTagsInputList.push(tagInput);
	}
	var tags = window.addTagsInputList.join(",");
	var url = "/api/users";
	$.ajax({
		type: "POST",
		url: url,
		dataType: 'json',
		data: {
			'dir_id': id,
			'name': name,
			'email': email,
			'role': role,
			// 'course': course,
			'tags': tags
		},
		success: function(response) {
			if (response.success) {
				clearAddUserForm();
				window.users = response.data;
				populateUsers(response.data);
			} else {
				if (response.rejection) {
					$('#userPromiseRejectionModal').modal({
						show: true
					});
				} else {
					$('#invalidUserInputModal').modal({
						show: true
					});
				}
			}
		}
	})
}

function addValidate() {
	var id = document.getElementById('add-user-id').value;
	var name = document.getElementById('add-user-name').value;
	var email = document.getElementById('add-user-email').value;
	var tags = window.addTagsInputList;

	var emailSpecial = new RegExp(/^(?=.{1,100}$)([^\s@]+@[^\s@]+\.[^\s@]+)$/);
	var special = new RegExp(/^[a-zA-Z0-9]{1,20}$/);
	var nameSpecial = new RegExp(/^[a-zA-Z0-9\s]{1,50}$/);

	var form = document.querySelector('#addForm');
	form.reportValidity();

	if (id==undefined || name==undefined || email==undefined || tags==undefined) {
		return false;
	}
	if (id.length==0 || name.length==0 || email.length==0) {
		return false;
	}
	if (!special.test(id) || !nameSpecial.test(name) || !emailSpecial.test(email)) {
		return false;
	}
	for (var i=0; i< tags.length; i++) {
		tags[i] = tags[i].trim();
		tags[i] = tags[i].trimLeft();
	}

	addUser();
	$('#addUserModal').modal("hide");
}

function clearAddUserForm() {
	document.getElementById("add-user-id").value = "";
	document.getElementById("add-user-name").value = "";
	document.getElementById("add-user-email").value = "";
	document.getElementById("add-user-role").value = "";
	document.getElementById("add-user-tags").value = "";
	window.addTagsInputList = [];
	updateAddTagListDisplay();
}

function editUser() {
	var id = document.getElementById("edit-user-id").value;
	var name = document.getElementById("edit-user-name").value;
	var email = document.getElementById("edit-user-email").value;
	var role = document.getElementById("edit-user-role").value;
	var tagInput = document.getElementById("edit-user-tags").value;
	if (tagInput != "") {
		window.editTagsInputList.push(tagInput);
	}
	var tags = window.editTagsInputList.join(",");
	var url = "/api/users/edit";
	$.ajax({
		type: "POST",
		url: url,
		dataType: 'json',
		data: {
			'dir_id': id,
			'name': name,
			'email': email,
			'role': role,
			// 'course': course,
			'tags': tags
		},
		success: function(response) {
			if (response.success) {
				window.users = response.data;
				populateUsers(response.data);
			} else {
				if (response.rejection) {
					$('#userPromiseRejectionModal').modal({
						show: true
					});
				} else {
					$('#invalidUserInputModal').modal({
						show: true
					});
				}
			}
		}
	})
}

function editValidate() {
	var name = document.getElementById('edit-user-name').value;
	var email = document.getElementById('edit-user-email').value;
	var tags = window.editTagsInputList;

	var emailSpecial = new RegExp(/^(?=.{1,100}$)([^\s@]+@[^\s@]+\.[^\s@]+)$/);
	var nameSpecial = new RegExp(/^[a-zA-Z0-9\s]{1,50}$/);

	var form = document.querySelector('#editForm');
	form.reportValidity();

	if (name==undefined || email==undefined || tags==undefined) {
		return false;
	}
	if (name.length==0 || email.length==0) {
		return false;
	}
	if (!nameSpecial.test(name) || !emailSpecial.test(email)) {
		return false;
	}
	for (var i=0; i< tags.length; i++) {
		tags[i] = tags[i].trim();
		tags[i] = tags[i].trimLeft();
	}

	editUser();
	$('#editUserModal').modal("hide");
}

function deleteUser() {
	var id = document.getElementById("delete-user-id").innerHTML;
	var url = "/api/users";
	$.ajax({
		type: "DELETE",
		url: url,
		dataType: 'json',
		data: {
			dir_id: id
		},
		success: function(response) {
			if (response.success) {
				window.users = response.data;
				populateUsers(response.data);
			} else {
				if (response.rejection) {
					$('#userPromiseRejectionModal').modal({
						show: true
					});
				} else {
					console.log("Error deleteUser() : This should never happen.");
				}
			}
		}
	})
}

function initTagsList() {
	var addBox = document.getElementById("add-user-tags");
	addBox.onkeyup = addTagsTextHandler;
	addBox.onblur = addTagsTextHandler;
	window.addTagsInputList = [];

	var editBox = document.getElementById("edit-user-tags");
	editBox.onkeyup = editTagsTextHandler;
	editBox.onblur = editTagsTextHandler;
	window.editTagsInputList = [];
}

function addTagsTextHandler() {
	var box = document.getElementById("add-user-tags");
	if (box.value.charAt(box.value.length - 1) == ',' || box.value.charAt(box.value.length - 1) == '\n') {
		var tag = box.value.substring(0, box.value.length - 1);
		if (tag.length > 0) {
			window.addTagsInputList.push(tag);
			updateAddTagListDisplay();
		}
		box.value = "";
	}
}

function editTagsTextHandler() {
	var box = document.getElementById("edit-user-tags");
	if (box.value.charAt(box.value.length - 1) == ',' || box.value.charAt(box.value.length - 1) == '\n') {
		var tag = box.value.substring(0, box.value.length - 1);
		if (tag.length > 0) {
			window.editTagsInputList.push(tag);
			updateEditTagListDisplay();
		}
		box.value = "";
	}
}

function removeFromAddTagListIdx(tagIdx) {
	window.addTagsInputList.splice(tagIdx, 1);
	updateAddTagListDisplay();
}

function removeFromEditTagListIdx(tagIdx) {
	window.editTagsInputList.splice(tagIdx, 1);
	updateEditTagListDisplay();
}

function updateAddTagListDisplay() {
	var holder = document.getElementById("add-tags-list-holder");
	holder.innerHTML = "";
	for (var i = 0; i < window.addTagsInputList.length; i++) {
		holder.innerHTML += "<span class='badge badge-secondary list-item'>" + window.addTagsInputList[i] + "<span aria-hidden='true' class='list-close'><a href='javascript:void(0)' onclick='removeFromAddTagListIdx(" + i + ")'>&times;</a></span></span> ";
	}
}

function updateEditTagListDisplay() {
	var holder = document.getElementById("edit-tags-list-holder");
	holder.innerHTML = "";
	for (var i = 0; i < window.editTagsInputList.length; i++) {
		holder.innerHTML += "<span class='badge badge-secondary list-item'>" + window.editTagsInputList[i] + "<span aria-hidden='true' class='list-close'><a href='javascript:void(0)' onclick='removeFromEditTagListIdx(" + i + ")'>&times;</a></span></span> ";
	}
}