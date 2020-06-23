function initSettingsPage() {
	initUserDisplay();
	$("#settingsForm").submit(function(e) {
		e.preventDefault();
	});
	fillForm();
	// More stuff will go here
}

function checkPerms() {
	fillForm();
}

function fillForm() {
	document.getElementById("settings-uid").value = window.currUser.dir_id;
	document.getElementById("settings-uid").placeholder = window.currUser.dir_id;
	document.getElementById("settings-name").value = window.currUser.name;
	document.getElementById("settings-name").placeholder = window.currUser.name;
	document.getElementById("settings-email").value = window.currUser.email;
	document.getElementById("settings-email").placeholder = window.currUser.email;
}

function saveSettings() {
	var name = document.getElementById("settings-name").value;
	var email = document.getElementById("settings-email").value;
	var url = '/api/user';

	var nameSpecial = new RegExp(/^[a-zA-Z0-9\s]{1,50}$/);
	var emailSpecial = new RegExp(/^(?=.{1,100}$)([^\s@]+@[^\s@]+\.[^\s@]+)$/);

	if (name==undefined || email==undefined) {
		return false;
	}
	if (!nameSpecial.test(name) || !emailSpecial.test(email)) {
		return false;
	}

	$.ajax({
		type: "POST",
		url: url,
		dataType: 'json',
		data: {
			'name': name,
			'email': email,
		},
		success: function(response) {
			console.log(response);
			if (response.success) {
				window.location.href = '/users';
			}
		}
	})
}
