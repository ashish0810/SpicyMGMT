const mysql = require('mysql');

module.exports = class MySqlClient {
	constructor(host, user, password, database) {
		console.log("Initializing mySQL DB Client...");
		this.host = host == undefined ? 'hardCodedHost': host;
		this.user = user == undefined ? 'hardCodedUser': user;
		this.password = password == undefined ? 'hardCodedPass': password;
		this.database = database == undefined ? 'hardCodedDB': database;
		this.pool = mysql.createPool({
			connectionLimit: 10,
			host: this.host,
			user: this.user,
			password: this.password,
			database: this.database,
		});
	}

	// Executes the query provided
	executeQuery(sql) {
		const pool = this.pool;
		return new Promise(function(resolve, reject) {
			pool.getConnection((err, connection) => {
				if (err) {
					console.log(err);
					return reject(err);
				}
				connection.query(sql, (err, response) => {
					connection.release();
					if (err) {
						console.log(sql);
						console.error(err);
						return reject(err);
					}
					resolve(response);
				});
			});
		});
	}

////////// USER FUNCTIONS //////////

	getUserInfo(dir_id) {
		const sql = `SELECT * FROM user WHERE dir_id='${dir_id}'`;
		return this.executeQuery(sql);
	}

	editCurrUser(dir_id, name, email) {
		const sql = `UPDATE user SET name='${name}',email='${email}' WHERE dir_id='${dir_id}'`;
		return this.executeQuery(sql);
	}

	getUsers() {
		const sql = 'SELECT * FROM user';
		return this.executeQuery(sql);
	}

	addUser(dir_id, name, email, role, course, tags) {
		const sql = `INSERT INTO user (dir_id, name, email, role, course, tags) VALUES ('${dir_id}','${name}','${email}','${role}','${course}','${tags}')`;
		return this.executeQuery(sql);
	}

	editUser(dir_id, name, email, role, course, tags) {
		const sql = `UPDATE user SET name='${name}',email='${email}',role='${role}',course='${course}',tags='${tags}' WHERE dir_id='${dir_id}'`;
		return this.executeQuery(sql);
	}

	deleteUser(dir_id) {
		const sql = `DELETE FROM user WHERE dir_id='${dir_id}'`;
		return this.executeQuery(sql);
	}

////////// TASK FUNCTIONS //////////

	getTasks() {
		const sql = 'SELECT * FROM task ORDER BY due_date';
		return this.executeQuery(sql);
	}

	getTask(task_id) {
		const sql = `SELECT * FROM task WHERE task_id=${task_id}`;
		return this.executeQuery(sql);
	}

	getSubtasks(task_id) {
		const sql = `SELECT * FROM subtask WHERE task_id=${task_id} ORDER BY priority_number`;
		return this.executeQuery(sql);
	}

	getSubtask(subtask_id) {
		const sql = `SELECT * FROM subtask WHERE subtask_id=${subtask_id}`;
		return this.executeQuery(sql);
	}

	getSubtasksWithStage(task_id, stage) {
		const sql = `SELECT * FROM subtask WHERE task_id=${task_id} AND priority_number=${stage}`;
		return this.executeQuery(sql);
	}

	getUsersForSubtask(subtask_id) {
		const sql = `SELECT * FROM works_on WHERE subtask_id=${subtask_id}`;
		return this.executeQuery(sql);
	}

	getSubtasksForUser(dir_id) {
		const sql = `SELECT * FROM works_on WHERE dir_id='${dir_id}'`;
		return this.executeQuery(sql);
	}

	getFilesForSubtask(subtask_id) {
		const sql = `SELECT * FROM associated_with WHERE subtask_id=${subtask_id}`;
		return this.executeQuery(sql);
	}

	addTask(name, description, due_date) {
		var sql;
		if (due_date == undefined) {
			sql = `INSERT INTO task (name, description) VALUES ('${name}','${description}')`;
		} else {
			sql = `INSERT INTO task (name, description, due_date) VALUES ('${name}','${description}','${due_date}')`;
		}
		return this.executeQuery(sql);
	}

	addSubtask(task_id, name, description, stage) {
		const sql = `INSERT INTO subtask (task_id, name, description, priority_number) VALUES(${task_id}, '${name}', '${description}', ${stage})`;
		return this.executeQuery(sql);
	}

	addUserToSubtask(dir_id, subtask_id) {
		const sql = `INSERT INTO works_on (dir_id, subtask_id) VALUES ('${dir_id}', ${subtask_id})`;
		return this.executeQuery(sql);
	}

	addFileToSubtask(doc_id, version, subtask_id) {
		const sql = `INSERT INTO associated_with (doc_id, version, subtask_id) VALUES (${doc_id}, ${version}, ${subtask_id})`;
		return this.executeQuery(sql);
	}

	editTask(task_id, description, name, due_date) {
		var sql;
		if (due_date == undefined) {
			sql = `UPDATE task SET name='${name}',due_date=null,description='${description}' WHERE task_id='${task_id}'`;
		} else {
			sql = `UPDATE task SET name='${name}',due_date='${due_date}',description='${description}' WHERE task_id='${task_id}'`;
		}
		return this.executeQuery(sql);
	}

	editSubtask(subtask_id, name, description, stage) {
		const sql = `UPDATE subtask SET name='${name}',description='${description}',priority_number='${stage}' WHERE subtask_id='${subtask_id}'`;
		return this.executeQuery(sql);
	}

	deleteSubtaskFromWorks(subtask_id) {
		const sql = `DELETE FROM works_on WHERE subtask_id=${subtask_id}`;
		return this.executeQuery(sql);
	}

	deleteUserFromSubtask(dir_id, subtask_id){
		const sql = `DELETE FROM works_on WHERE subtask_id=${subtask_id} AND dir_id='${dir_id}'`;
		return this.executeQuery(sql);
	}

	deleteSubtaskFromSubtasks(subtask_id) {
		const sql = `DELETE FROM subtask WHERE subtask_id=${subtask_id}`;
		return this.executeQuery(sql);
	}

	deleteFileFromAllSubtasks(doc_id, version) {
		const sql = `DELETE FROM associated_with WHERE doc_id=${doc_id} AND version=${version}`;
		return this.executeQuery(sql);
	}

	deleteFileFromSubtask(doc_id, version, subtask_id) {
		const sql = `DELETE FROM associated_with WHERE doc_id=${doc_id} AND version=${version} AND subtask_id=${subtask_id}`;
		return this.executeQuery(sql);
	}

	deleteSubtaskFileAssociation(subtask_id) {
		const sql = `DELETE FROM associated_with WHERE subtask_id=${subtask_id}`;
		return this.executeQuery(sql);
	}

	deleteTask(task_id) {
		const sql = `DELETE FROM task WHERE task_id=${task_id}`;
		return this.executeQuery(sql);
	}

	markSubtask(dir_id, subtask_id, completed) {
		const sql = `UPDATE works_on SET completed=${completed} WHERE dir_id='${dir_id}' and subtask_id=${subtask_id}`;
		return this.executeQuery(sql);
	}

	setSubtaskEndTime(subtask_id, finished) {
		var sql = '';
		if (finished){
			sql = `UPDATE subtask SET end_time=NOW() WHERE subtask_id=${subtask_id}`;
		} else {
			sql = `UPDATE subtask set end_time=NULL WHERE subtask_id=${subtask_id}`;
		}
		return this.executeQuery(sql);
	}

	getComments() {
		const sql = 'SELECT * FROM comment';
		return this.executeQuery(sql);
	}

	getSubtaskComments(subtask_id) {
		const sql = `SELECT * FROM comment WHERE subtask_id=${subtask_id}`;
		return this.executeQuery(sql);
	}

	addComment(subtask_id, content, creator) {
		const sql = `INSERT INTO comment (subtask_id, content, creator) VALUES ('${subtask_id}','${content}','${creator}')`;
		return this.executeQuery(sql);
	}

////////// FILE FUNCTIONS //////////

	getAllFiles() {
		const sql = `SELECT * FROM document ORDER BY doc_id ASC, version DESC`;
		return this.executeQuery(sql);
	}

	getFiles(folder) {
		const sql = `SELECT * FROM document WHERE parent='${folder}' ORDER BY doc_id ASC, version DESC`;
		return this.executeQuery(sql);
	}

	getDocument(doc_id, version) {
		const sql = `SELECT * FROM document WHERE doc_id='${doc_id}' and version='${version}'`;
		return this.executeQuery(sql);
	}

	createFolder(parent, folder, creator) {
		const sql = `INSERT INTO document (version, creator, name, parent, deleted, folder) VALUES ('0', '${creator}', '${folder}', '${parent}', '0', '1')`;
		return this.executeQuery(sql);
	}

	addFile(new_file, doc_id, version, creator, name, file_path, parent) {
		var sql = '';
		if (new_file) {
			sql = `INSERT INTO document (version, creator, name, parent, deleted, folder) VALUES ('${version}','${creator}','${name}','${parent}','0','0')`;
		} else {
			sql = `INSERT INTO document (doc_id, version, creator, name, parent, deleted, folder) VALUES ('${doc_id}','${version}','${creator}','${name}','${parent}','0','0')`;
		}
		return this.executeQuery(sql);
	}

	hardDeleteFile(doc_id, version) {
		const sql = `DELETE FROM document WHERE doc_id='${doc_id}' AND version='${version}'`;
		return this.executeQuery(sql);
	}

	deleteFile(doc_id, deleted) {
		const sql = `UPDATE document SET deleted='${deleted}' WHERE doc_id='${doc_id}'`;
		return this.executeQuery(sql);
	}

	deleteFileVersion(doc_id, version, deleted) {
		const sql = `UPDATE document SET deleted='${deleted}' WHERE doc_id='${doc_id}' AND version='${version}'`;
		return this.executeQuery(sql);
	}

	getSameName(name, folder) {
		const sql = `SELECT * FROM document WHERE name = '${name}' AND parent = '${folder}'`;
		return this.executeQuery(sql);
	}

	getMaxDocId() {
		const sql = 'SELECT MAX(doc_id) FROM document';
		return this.executeQuery(sql);
	}

	getChildrenOne(parent) {
		const sql = `SELECT * FROM document WHERE parent REGEXP '^${parent}$'`;
		return this.executeQuery(sql);
	}

	getChildrenTwo(parent) {
		const sql = `SELECT * FROM document WHERE parent REGEXP '^${parent}/'`;
		return this.executeQuery(sql);
	}

////////// EMAIL FUNCTIONS //////////

	getIncompleteTasks() {
		const sql = `SELECT * FROM works_on WHERE completed=0`;
		return this.executeQuery(sql);
	}

}
