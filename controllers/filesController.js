// Controllers for routes related to files will go here

var fs = require('fs');
var os = require('os');
var AdmZip = require('adm-zip');
var archiver = require('archiver');

var DELIMITER = os.platform() == "win32" ? "\\" : "/";

function validate (req) {
	return true;
}

// Function returns files stored in database/JSON.
async function getFiles(req, res, dbClient) {
	try {
		var files;
		if (req.query.folder) {
			files = await dbClient.getFiles(req.query.folder);
		} else {
			files = await dbClient.getAllFiles();
		}
		var data = [];
		var index = 0;
		var currID = 0;
		for (var i = 0; i < files.length; i++) {
			if (files[i].doc_id > currID) {
				currID = files[i].doc_id;
				index += 1;
				var file = {
					doc_id: files[i].doc_id,
					name: files[i].name,
					parent: files[i].parent,
					folder: (files[i].folder == 1),
					deleted: true,
					version: []
				}
				var version = {
					version: files[i].version,
					upload_date: files[i].upload_date,
					creator: files[i].creator,
					deleted: files[i].deleted == 1
				}
				file.version.push(version);
				file.deleted = file.deleted && version.deleted;
				data.push(file);
			} else {
				var version = {
					version: files[i].version,
					upload_date: files[i].upload_date,
					creator: files[i].creator,
					deleted: files[i].deleted == 1
				}
				data[index - 1].version.push(version);
				data[index - 1].deleted = data[index - 1].deleted && version.deleted
			}
		}
		res.json({ data: data });
	}
	catch(e) {
		console.log("getFiles() promise rejection: " + e);
		res.json({ success: false,
			rejection: true });
	}
}

async function createFolder(req, res, dbClient) {
	var path = process.env.FILES_ROOT + DELIMITER + req.body.basepath + DELIMITER + req.body.name;
	var nameSpecial = new RegExp(/^[a-zA-Z0-9\s]{0,50}$/);
	if (!nameSpecial.test(req.body.name)) {
		res.json({
			success: false,
			rejection: false
		});
		return;
	}
	try {
	  if (!fs.existsSync(path)){
		fs.mkdirSync(path)
	  }
	} catch (err) {
	  console.error(err)
	}
	var allFiles = await dbClient.getAllFiles();
	var exists = false;
	for (var i = 0; i < allFiles.length; i++) {
		if (allFiles[i].name == req.body.name && allFiles[i].parent == req.body.basepath) {
			exists = true;
		}
	}
	if (!exists) {
		try {
			const response = await dbClient.createFolder(req.body.basepath, req.body.name, req.session.cas.user);
			const success = response.affectedRows == 1;
			res.json({ success: success });
		} catch(e) {
			console.log("createFolder() promise rejection: " + e);
			res.json({
				success: false,
				rejection: true
			});
		}
	}
}

async function addFilesHelper(name, parent, creator, orig_path, generateFile, dbClient, fileInZip) {
	var doc_id = null;
	var version = null;
	var new_file = false;

	const same_name = await dbClient.getSameName(name, parent);
	const max_doc_id = await dbClient.getMaxDocId();
	if (same_name.length != 0) {
		version = same_name.length + 1;
		doc_id = same_name[0].doc_id;
	} else {
		new_file = true;
		version = 1;
		doc_id = max_doc_id + 1;
	}

	var split = name.split(".");
	var newFileName = split[0] + "_v" + version + (split[1] ? "." + split[1] : "");
	var newPath = parent + newFileName;
	
	var oldpath = ""
	if (fileInZip) {
		generateFile(orig_path, name, parent, newFileName);
		oldpath = process.env.FILES_ROOT + DELIMITER + parent + name;
	} else {
		oldpath = orig_path;
	}

	fs.rename(oldpath, process.env.FILES_ROOT + newPath, async function(err) {
		if ( err ) console.log('ERROR: ' + err);
		try {
			const success = await dbClient.addFile(new_file, doc_id, version, creator, name, newPath, parent);
		}
		catch(e) {
			console.log("addFilesHelper() promise rejection: " + e);
			res.json({
				success: false,
				rejection: true
			});
		}
	});
}

// Function adds all files contained in req.files to either the database or the
// local JSON file. Additionally, for each file the function changes the name of
// the file in the "uploads" folder to reflect the version of the file. Each file
// maintains its original name in the database/JSON though the updated name will
// be reflected in the filepath stored in the database/JSON.
// Uploading multiple files. Files must be passed as an array.
// I've set the max number of files that can be uploaded at once to 100.
async function addFiles(req, res, dbClient) {
	if (!req.files) {
		const error = new Error ('File upload failed.');
		error.httpStatusCode = 400;
		return next(error);
	}

	for (var i = 0; i < req.files.length; i++) {
		var file = req.files[i];
		var orig_path = file.path;
		var name = file.originalname;
		var creator = req.session.cas.user;
		var parent = req.body.folder;

		var extension = name.split(".");
		if (extension[extension.length - 1] === "zip") {
			var zip = new AdmZip(orig_path);
			var zipEntries = zip.getEntries();
			var allFiles = await dbClient.getAllFiles();
			zipEntries.forEach(function(zipEntry) {
				var fileName = zipEntry.entryName;
				var isDirectory = zipEntry.isDirectory;
				if (isDirectory) {
					// FOLDER IN ZIP FILE //
					var tempSplit = fileName.split(DELIMITER);
					var path = parent + tempSplit.splice(0, tempSplit.length - 1).join(DELIMITER);
					var split = path.split(DELIMITER);
					try {
						if (!fs.existsSync(process.env.FILES_ROOT + DELIMITER + path)){
							fs.mkdirSync(process.env.FILES_ROOT + DELIMITER + path)
						}
					} catch (err) {
						console.error(err)
					}
					try {
						var folderParent = split.splice(0, split.length - 1).join(DELIMITER) + DELIMITER;
						var folderName = split[split.length - 1];
						var exists = false;
						for (var i = 0; i < allFiles.length; i++) {
							if (allFiles[i].name == folderName && allFiles[i].parent == folderParent) {
								exists = true;
							}
						}
						if (!exists) {
							dbClient.createFolder(folderParent, folderName, creator);
						}
					} catch(e) {
						console.log("addFiles(), createFoler() zipEntries promise rejection: " + e);
						res.json({ success: false,
							rejection: true });
					}
				} else {
					// FILE IN ZIP FILE //
					var split = fileName.split(DELIMITER);
					var path = parent + (split.length > 1 ? split.splice(0, split.length - 1).join(DELIMITER) : "") + DELIMITER;
					var generateFile = (orig_path, name, parent, newFileName) => {
						zip.extractEntryTo(fileName, process.env.FILES_ROOT + DELIMITER + parent, false, true);
					}
					addFilesHelper(split[split.length - 1], path, creator, orig_path, generateFile, dbClient, true);
				}
			});
			try {
				fs.unlinkSync(orig_path);
			} catch (e) {
				console.err(e);
			}
		} else {
			// FOR NON-ZIP FILES //
			var generateFile = (orig_path, name, parent, newFileName) => {}
			addFilesHelper(name, parent, creator, orig_path, generateFile, dbClient, false);
		}
	}
	res.redirect('/files');
}

// Function implements a soft delete of a file. Marks function as deleted in the
// database/JSON so that the file will not be listed on the files page.
async function deleteFile(req, res, dbClient) {
	try {
		const success = await dbClient.deleteFile(req.body.doc_id, 1);
		const data = await dbClient.getFiles();
		res.json({
			success: success,
			data: data
		});
	}
	catch(e) {
		console.log("deleteFile() promise rejection: " + e);
		res.json({ success: false,
			rejection: true });
	}
}

async function deleteFileVersion(req, res, dbClient) {
	try {
		const success = await dbClient.deleteFileVersion(req.body.doc_id, req.body.version, 1);
		const data = await dbClient.getFiles();
		res.json({
			success: success,
			data: data
		});
	}
	catch(e) {
		console.log("deleteFileVersion() promise rejection: " + e);
		res.json({ success: false,
			rejection: true });
	}
}

async function recoverFileVersion(req, res, dbClient) {
	try {
		const success = await dbClient.deleteFileVersion(req.body.doc_id, req.body.version, 0);
		const data = await dbClient.getFiles();
		res.json({
			success: success,
			data: data
		});
	}
	catch(e) {
		console.log("recoverFileVersion() promise rejection: " + e);
		res.json({ success: false,
			rejection: true });
	}
}

async function downloadFile(req, res, dbClient) {
	try {
		var doc_id = req.query.doc_id;
		var version = req.query.version;
		var response = await dbClient.getDocument(doc_id, version);
		var entry = response[0];
		if (entry.version == 0 && entry.folder == 1) {
			var archive = archiver('zip', { zlib: { level: 6 } });
			archive.on('warning', function(err) {
				if (err.code === 'ENOENT') {
					console.log(err);
				} else {
					throw err;
				}
			});
			archive.on('error', function(err) {
				throw err;
			});
			var filename = "." + DELIMITER + "temp" + DELIMITER + entry.name + '.zip';
			var output = fs.createWriteStream(filename);
			archive.pipe(output);
			var path = entry.parent + entry.name;
			var moveFolderRecursive = function(parent, name) {
				var path = parent + name;
				if(fs.existsSync(process.env.FILES_ROOT + path)) {
					var tempFolder = "." + DELIMITER + "temp" + DELIMITER + name;
					if (!fs.existsSync(tempFolder)) {
						fs.mkdirSync(tempFolder);
					}
					fs.readdirSync(process.env.FILES_ROOT + path).forEach(function(file,index){
						var currPath = path + DELIMITER + file;
						var tempPath = "." + DELIMITER + "temp" + DELIMITER + name + DELIMITER + file;
						var newPath = tempPath.replace(/_v\d$/i, "");
						newPath = newPath.replace(/_v\d\./i, ".");
						if(fs.lstatSync(process.env.FILES_ROOT + currPath).isDirectory()) {
							moveFolderRecursive(parent, name + DELIMITER + file);
						} else {
							fs.copyFile(process.env.FILES_ROOT + currPath, newPath, (err) => {
								if (err) throw err;
							});
						}
					});
				}
			};
			var tempPath = "." + DELIMITER + "temp" + DELIMITER + entry.name;
			if (!fs.existsSync(tempPath) ) {
				fs.mkdirSync(tempPath);
			}
			moveFolderRecursive(entry.parent, entry.name);
			archive.directory(tempPath, entry.name);
			archive.finalize();
			output.on('close', function() {
				console.log(archive.pointer() + ' total bytes');
				console.log('archiver has been finalized and the output file descriptor has closed.');
				res.download(filename, (err) => {
					if (err) throw err;
					fs.unlinkSync(filename);
					var deleteFolderRecursive = function(path) {
						if(fs.existsSync(path)) {
							fs.readdirSync(path).forEach(function(file,index){
								var currPath = path + DELIMITER + file;
								if(fs.lstatSync(currPath).isDirectory()) {
									deleteFolderRecursive(currPath);
								} else {
									fs.unlinkSync(currPath);
								}
							});
							fs.rmdirSync(path);
						}
					};
					deleteFolderRecursive(tempPath);
				});
			});
			output.on('end', function() {
				console.log('Data has been drained');
			});
		} else {
			var split = entry.name.split(".");
			var filename = split[0] + "_v" + entry.version + (split[1] ? "." + split[1] : "");
			var path = process.env.FILES_ROOT + entry.parent + filename;
			var newPath = "temp" + DELIMITER + entry.name;
			console.log("PATH: " + path);
			console.log("NEWPATH: " + newPath);
			fs.copyFile(path, newPath, (err) => {
  			if (err) throw err;
				res.download(newPath, (err) => {
					if (err) throw err;
					fs.unlinkSync(newPath);
				});
			});
		}
	} catch (e) {
		console.log("downloadFile() promise rejection: " + e);
		res.json({ success: false,
			rejection: true });
	}
}

async function hardDeleteFile(req, res, dbClient) {
	if (req.body.version == 0) {
		var filepath = req.body.parent + req.body.name;
		var deleteFolderRecursive = function(path) {
			if(fs.existsSync(path)) {
				fs.readdirSync(path).forEach(function(file,index){
				  var currPath = path + DELIMITER + file;
				  if(fs.lstatSync(currPath).isDirectory()) {
					deleteFolderRecursive(currPath);
				  } else {
					fs.unlinkSync(currPath);
				  }
				});
				fs.rmdirSync(path);
			}
		};
		deleteFolderRecursive(process.env.FILES_ROOT + filepath);
		await dbClient.hardDeleteFile(req.body.doc_id, req.body.version);
		await dbClient.deleteFileFromAllSubtasks(req.body.doc_id, req.body.version);
		const childrenOne = await dbClient.getChildrenOne(filepath);
		const childrenTwo = await dbClient.getChildrenTwo(filepath);
		var children = childrenOne.concat(childrenTwo);
		for (var i = 0; i < children.length; i++) {
			try {
				await dbClient.hardDeleteFile(children[i].doc_id, children[i].version);
				await dbClient.deleteFileFromAllSubtasks(children[i].doc_id, children[i].version);
				const data = await dbClient.getFiles();
			} catch(e) {
				console.log("hardDeleteFile() promise rejection: " + e);
				res.json({
					success: false,
					rejection: true
				});
				return;
			}
		}
		res.json({ success: true });
	} else {
		var split = req.body.name.split(".");
		var filepath = process.env.FILES_ROOT + req.body.parent + split[0] + "_v" + req.body.version + (split[1] ? "." + split[1] : "");
		try {
			fs.unlinkSync(filepath);
			console.log("Deleted File: " + filepath);
		} catch(e) {
			console.log("Error Deleting File: " + filepath);
			console.log("Error: " + e);
			if (e.code != "ENOENT") {
				res.json({
					success: false
				});
				return;
			}
		}
		try {
			var response = await dbClient.hardDeleteFile(req.body.doc_id, req.body.version);
			await dbClient.deleteFileFromAllSubtasks(req.body.doc_id, req.body.version);
			var success = response.affectedRows > 0;
			const data = await dbClient.getFiles();
			res.json({
				success: success,
				data: data
			});
		} catch(e) {
			console.log("hardDeleteFile() promise rejection: " + e);
			res.json({
				success: false,
				rejection: true
			});
		}
	}
}

exports.getFiles = getFiles;
exports.createFolder = createFolder;
exports.addFiles = addFiles;
exports.deleteFile = deleteFile;
exports.deleteFileVersion = deleteFileVersion;
exports.recoverFileVersion = recoverFileVersion;
exports.downloadFile = downloadFile;
exports.hardDeleteFile = hardDeleteFile;
