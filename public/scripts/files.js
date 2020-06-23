function initFilesPage() {
	initUserDisplay();
	currFolder.push("root");
	displayPath.push("root");
	updateFiles();
	prepUploadFilesModal();
	prepCreateFolderModal();
}

function prepUploadFilesModal() {
	$('#uploadFilesModal').on('show.bs.modal', function(event) {
		var modal = $(this);
		var path = (fullPath.length > 0 ? "/" + fullPath.join("/") + "/" : "/");
		modal.find('.modal-body #upload-file-parent').val(path);
	});
}

function prepCreateFolderModal() {
	$('#createFolderModal').on('show.bs.modal', function(event) {
		var modal = $(this);
		var path = (fullPath.length > 0 ? "/" + fullPath.join("/") + "/" : "/");
		modal.find('.modal-body #create-folder-parent-path').val(path);
	});
}

var currFolder = [];
var fullPath = [];
var displayPath = [];

function updateFiles() {
	var path = (fullPath.length > 0 ? "/" + fullPath.join("/") + "/" : "/");
	var url = "/api/files?folder=" + escape(path);
	$.ajax({
		type: "GET",
		url: url,
		success: function(response) {
			if (response.success || response.success==undefined) {
				window.files = response.data;
				populateFiles(response.data);
			} else {
				if (response.rejection) {
					$('#filesPromiseRejectionModal').modal({
						show: true
					});
				} else {
					console.log("Error updateFiles(): This should never happen.");
				}
			}
		}
	});
}

// Takes list of all files as a parameter. Iterates through files and
// creates HTML for each file in order to populate the files page with a list of
// the most recent version of each file. Calls prepDeleteFileModal in order to
// prepare the delete file modal for each file entry in the list.
function populateFiles(files) {
	document.getElementById("display-folder-path").innerHTML = "/" + currFolder.join("/");
	var everyFile = "";
	if (displayPath.length > 0) {
		everyFile += "<tr>";
		everyFile += "<td colspan='5'><a href='javascript:void(0)' onclick='folderUp()'>Go up a folder</a></td>";
		everyFile += "</tr>";
	}
	for (var i = 0; i < files.length; i++) {
		if (!files[i].version[0].deleted) {
			var date = new Date(files[i].version[0].upload_date);
			var month = date.getMonth() + 1;
			var minutes = (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes());
			var formattedDate = month + "/" + date.getDate() + "/" + date.getFullYear() + " " + date.getHours() + ":" + minutes;
			var currFile = "<tr>";
			if (files[i].folder) {
				currFile += "<td><a href='javascript:void(0)' onclick='showFolder(\"" + files[i].name + "\")'>" + files[i].name + " (Folder)</a></td>";
				currFile += "<td>" + formattedDate + "</td>";
				currFile += "<td>" + files[i].version[0].creator + "</td>";
				currFile += "<td><a class='mr-2' href='/api/files/download?doc_id=" + files[i].doc_id + "&version=" + files[i].version[0].version + "'><i data-feather='download'></i></a>";
				currFile += "<a class='mr-2' href='#' data-toggle='modal' data-target='#deleteFolderModal' data-file='" + i + "'><i data-feather='trash-2'></i></a></td>";
			} else {
				currFile += "<td>" + files[i].name + "</td>";
				currFile += "<td>" + formattedDate + "</td>";
				currFile += "<td>" + files[i].version[0].creator + "</td>";
				currFile += "<td><a class='mr-2' href='/api/files/download?doc_id=" + files[i].doc_id + "&version=" + files[i].version[0].version + "'><i data-feather='download'></i></a>";
				currFile += "<a class='mr-2' href='#' data-toggle='modal' data-target='#deleteFileModal' data-file='" + i + "'><i data-feather='trash-2'></i></a>";
				currFile += "<a class='mr-2' href='#' data-toggle='modal' data-target='#viewFileModal' data-file='" + i + "'><i data-feather='list'></i></a></td>";
			}
			currFile += "</tr>";
			everyFile += currFile;
		}
	}
	document.getElementById("files-contain").innerHTML = everyFile;
	feather.replace();
	prepDeleteFileModal();
	prepViewFileModal();
	prepDeleteFileVersionModal();
}

function folderUp() {
	fullPath.pop();
	displayPath.pop();
	if (displayPath.length > 2){
		currFolder = [];
		currFolder.push("...");
		currFolder.push(displayPath[displayPath.length - 2]);
		currFolder.push(displayPath[displayPath.length - 1]);
	} else {
		currFolder = [];
		currFolder = displayPath;
	}
	updateFiles();
}

function showFolder(folder) {
	fullPath.push(folder);
	displayPath.push(folder);
	if (displayPath.length > 2){
		currFolder = [];
		currFolder.push("...");
		currFolder.push(displayPath[displayPath.length - 2]);
		currFolder.push(displayPath[displayPath.length - 1]);
	} else {
		currFolder = displayPath;
	}
	updateFiles();
}

// Preps the delete file modal of each file in the list with the information
// relevant to the specific file on which the user clicked delete. The modal
// will display a message along with the name of the specific file to ensure
// the user intends to delete the file.
function prepDeleteFileModal() {
	$('#deleteFileModal').on('show.bs.modal', function(event) {
		var button = $(event.relatedTarget);
		var idx = button.data('file');

		var file = window.files[idx];
		var modal = $(this);
		modal.find('.modal-body #delete-file-name').text("Name: " + file.name);
		modal.find('.modal-body #delete-file-doc_id').val(file.doc_id);
	});
	$('#deleteFolderModal').on('show.bs.modal', function(event) {
		var button = $(event.relatedTarget);
		var idx = button.data('file');

		var file = window.files[idx];
		console.log(file);
		var modal = $(this);
		modal.find('.modal-body #delete-folder-name').text("Name: " + file.name);
		modal.find('.modal-body #delete-folder-doc_id').val(file.doc_id);
	});
}

function prepDeleteFileVersionModal() {
	$('#deleteFileVersionModal').on('show.bs.modal', function(event) {
		var button = $(event.relatedTarget);
		var name = button.data('name')
		var doc_id = button.data('doc_id').toString();
		var version = button.data('version').toString();

		var modal = $(this);
		modal.find('.modal-body #delete-file-version-name').text(name);
		modal.find('.modal-body #delete-file-version-doc_id').text(doc_id);
		modal.find('.modal-body #delete-file-version-version').text(version);
	});
}

function prepViewFileModal() {
	$('#viewFileModal').on('show.bs.modal', function(event) {
		var button = $(event.relatedTarget);
		var idx = button.data('file');

		var file = window.files[idx];

		var modal = $(this);
		modal.find('.modal-header #viewFileModalLabel').html(file.name);

		var filesHTML = "";
		for (var i = 0; i < file.version.length; i++) {
			if (!file.version[i].deleted) {
				var date = new Date(file.version[i].upload_date);
				var month = date.getMonth() + 1;
				var minutes = (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes());
				var formattedDate = month + "/" + date.getDate() + "/" + date.getFullYear() + " " + date.getHours() + ":" + minutes;
				var currFile = "<tr>";
				currFile += "<td>" + file.version[i].version + "</td>";
				currFile += "<td>" + formattedDate + "</td>";
				currFile += "<td>" + file.version[i].creator + "</td>";
				currFile += "<td><a class='mr-2' href='/api/files/download?doc_id=" + file.doc_id + "&version=" + file.version[i].version + "'><i data-feather='download'></i></a>";
				currFile += "<a class='mr-2' href='#' data-toggle='modal' data-dismiss='modal' data-target='#deleteFileVersionModal' data-doc_id='" + file.doc_id + "' data-version='" + file.version[i].version + "' data-name='" + file.name + "'><i data-feather='trash-2'></i></a></td>";
				currFile += "</tr>";
				filesHTML += currFile;
			}
		}
		modal.find('.modal-body #view-files-contain').html(filesHTML);
		feather.replace();
	});
}

function deleteFile() {
	var doc_id = document.getElementById("delete-file-doc_id").value;
	doc_id += document.getElementById("delete-folder-doc_id").value;
	var url = "/api/files";
	$.ajax({
		type: "DELETE",
		url: url,
		data: {
			doc_id: doc_id
		},
		success: function(response) {
			if (response.success) {
				console.log(response);
				updateFiles();
			} else {
				if (response.rejection) {
					$('#filesPromiseRejectionModal').modal({
						show: true
					});
				} else {
					console.log("Error deleteFile(): This should never happen.");
				}
			}
		}
	})
}

function deleteFileVersion() {
	var str_doc_id = document.getElementById("delete-file-version-doc_id").textContent;
	var str_version = document.getElementById("delete-file-version-version").textContent;
	var doc_id = parseInt(str_doc_id);
	var version = parseInt(str_version);
	var url = "/api/files/del/version";
	$.ajax({
		type: "POST",
		url: url,
		data: {
			name: null,
			doc_id: doc_id,
			version: version
		},
		success: function(response) {
			if (response.success) {
				console.log(response);
				updateFiles();
			} else {
				if (response.rejection) {
					$('#filesPromiseRejectionModal').modal({
						show: true
					});
				} else {
					console.log("Error deleteFileVersion(): This should never happen.");
				}
			}
		}
	})
}

function createFolder() {
	var basepath = document.getElementById("create-folder-parent-path").value;
	var name = document.getElementById("create-folder-name").value;
	var url = "/api/files/folder";
	var nameSpecial = new RegExp(/^[a-zA-Z0-9\s]{0,50}$/);

	var form = document.querySelector('#createFolderForm');
	form.reportValidity();

	if (!nameSpecial.test(name)) {
		return false;
	}
	
	$('#createFolderModal').modal("hide");

	$.ajax({
		type: "POST",
		url: url,
		data: {
			basepath: basepath,
			name: name,
		},
		success: function(response) {
			if (response.success) {
				console.log(response);
				updateFiles();
			} else {
				if (response.rejection) {
					$('#filesPromiseRejectionModal').modal({
						show: true
					});
				} else {
					$('#filesInvalidFolderNameModal').modal({
						show: true
					});
				}
			}
		}
	});
}

function downloadFile(doc_id, version) {
	var url = "/api/files/download";
	$.ajax({
		type: "GET",
		url: url,
		data: {
			doc_id: doc_id,
			version: version
		},
		success: function(response) {
			console.log(response);
		}
	});
}
