function initRecyclePage() {
	initUserDisplay();
	updateRecycle();
}

function updateRecycle() {
	var url = "/api/files";
	$.ajax({
		type: "GET",
		url: url,
		success: function(response) {
			window.files = response.data;
			populateRecycle(response.data);
		}
	});
}

function populateRecycle(files) {
	var everyFile = "";
	for (var i = 0; i < files.length; i++) {
		for (var j = 0; j < files[i].version.length; j++) {
			if (files[i].version[j].deleted) {
				var date = new Date(files[i].version[j].upload_date);
				var month = date.getMonth() + 1;
				var minutes = (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes());
				var formattedDate = month + "/" + date.getDate() + "/" + date.getFullYear() + " " + date.getHours() + ":" + minutes;
        var idx = i + j;
				var currFile = "<tr>";
				currFile += "<td>" + files[i].name + "</td>";
				currFile += "<td>" + files[i].doc_id + "</td>";
				currFile += "<td>" + files[i].version[j].version + "</td>";
				currFile += "<td>" + formattedDate + "</td>";
				currFile += "<td>" + files[i].version[j].creator + "</td>";
				currFile += "<td><a class='mr-2' href='/api/files/download?doc_id=" + files[i].doc_id + "&version=" + files[i].version[j].version + "'><i data-feather='download'></i></a>";
				currFile += "<a class='mr-2' href='#' data-toggle='modal' data-target='#recoverFileVersionModal' data-doc_id='" + files[i].doc_id + "' data-version='" + files[i].version[j].version + "' data-name='" + files[i].name + "'><i data-feather='refresh-ccw'></i></a>";
				currFile += "<a class='mr-2' href='#' data-toggle='modal' data-target='#deleteFileVersionModal' data-doc_id='" + files[i].doc_id + "' data-version='" + files[i].version[j].version + "' data-name='" + files[i].name + "' data-parent='" + files[i].parent + "'><i data-feather='trash-2'></i></a></td>";
				currFile += "</tr>";
				everyFile += currFile;
			}
		}
	}
	document.getElementById("recycle-contain").innerHTML = everyFile;
	feather.replace();
	prepRecoverFileVersionModal();
	prepDeleteFileVersionModal();
}

function prepRecoverFileVersionModal() {
	$('#recoverFileVersionModal').on('show.bs.modal', function(event) {
		var button = $(event.relatedTarget);
		var name = button.data('name')
		var doc_id = button.data('doc_id').toString();
		var version = button.data('version').toString();

		var modal = $(this);
		modal.find('.modal-body #recover-file-version-name').text(name);
		modal.find('.modal-body #recover-file-version-doc_id').text(doc_id);
		modal.find('.modal-body #recover-file-version-version').text(version);
	});
}

function prepDeleteFileVersionModal() {
	$('#deleteFileVersionModal').on('show.bs.modal', function(event) {
		var button = $(event.relatedTarget);
		var name = button.data('name');
		var parent = button.data('parent');
		var doc_id = button.data('doc_id').toString();
		var version = button.data('version').toString();

		var modal = $(this);
		modal.find('.modal-body #delete-file-version-name').text(name);
		modal.find('.modal-body #delete-file-version-parent').text(parent);
		modal.find('.modal-body #delete-file-version-doc_id').text(doc_id);
		modal.find('.modal-body #delete-file-version-version').text(version);
	});
}

function recoverFileVersion() {
	var str_doc_id = document.getElementById("recover-file-version-doc_id").textContent;
	var str_version = document.getElementById("recover-file-version-version").textContent;
	var doc_id = parseInt(str_doc_id);
	var version = parseInt(str_version);
	var url = "/api/files/rec/version";
	$.ajax({
		type: "POST",
		url: url,
		data: {
			name: null,
			doc_id: doc_id,
			version: version
		},
		success: function(response) {
			console.log(response);
			updateRecycle();
		}
	})
}

function deleteFileVersion() {
	var name = document.getElementById("delete-file-version-name").textContent;
	var parent = document.getElementById("delete-file-version-parent").textContent;
	var str_doc_id = document.getElementById("delete-file-version-doc_id").textContent;
	var str_version = document.getElementById("delete-file-version-version").textContent;
	var doc_id = parseInt(str_doc_id);
	var version = parseInt(str_version);
	var url = "/api/files/version";
	$.ajax({
		type: "DELETE",
		url: url,
		data: {
			name: name,
			parent: parent,
			doc_id: doc_id,
			version: version
		},
		success: function(response) {
			if (response.success) {
				updateRecycle();
			}
		}
	})
}
