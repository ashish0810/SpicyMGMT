function test() {
	$.ajax({
		type: "GET",
		url: "/api",
		dataType: "json",
		success: function(response) {
			console.log(response);
			document.getElementById('test1').innerHTML = JSON.stringify(response);
		}
	});
	$.ajax({
		type: "GET",
		url: "/api/user",
		dataType: "json",
		success: function(response) {
			console.log(response);
			document.getElementById('test2').innerHTML = JSON.stringify(response);
		}
	});
}

function initUserDisplay() {
	var data = getSession();
	window.currUser = data.userInfo;
	document.getElementById('userDropdown').innerHTML = "Welcome, " + window.currUser.dir_id + "!";
	document.getElementById('top-title').innerHTML += " - " + window.currUser.course;
}

function getSession() {
	var name = "express:sess=";
	var decodedCookie = decodeURIComponent(document.cookie);
	var ca = decodedCookie.split(';');
	for(var i = 0; i <ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return JSON.parse(atob(c.substring(name.length, c.length)));
		}
	}
	return {};
}
