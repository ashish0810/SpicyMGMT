// Controllers for routes related to emails will go here

require('dotenv').config();

var mailOptions = {};

// This function will be called for reminders about specific tasks.
// Will add each email of persons associated with specified task and will
// add their email to the list of recipients. Will also include the name of
// the specific task in the text of the email.
async function sendReminder(req, res, dbClient, transporter) {
	var recipients = "";
	var course = "";
	var added = [];
	const task = await dbClient.getTask(req.body.id);
	const subtasks = await dbClient.getSubtasks(req.body.id);

	for (var i = 0; i < subtasks.length; i++) {
		const users = await dbClient.getUsersForSubtask(subtasks[i].subtask_id);
		for (var j = 0; j < users.length; j++) {
			const user = await dbClient.getUserInfo(users[j].dir_id);
			if (!added.includes(user[0].email)) {
				if (i === 0 && j === 0) {
					recipients += user[0].email;
					course = user[0].course;
					added.push(user[0].email);
				} else {
					recipients += ", " + user[0].email;
					added.push(user[0].email);
				}
			}
		}
	}


	var subject = "";
	var text = "";
	if (task[0].due_date != null) {
		var todayDate = new Date();
		var date = new Date(task[0].due_date);
		var month = date.getMonth() + 1;
		var minutes = (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes());
		var hour = (date.getHours() < 10 ? "0" + date.getHours() : date.getHours());
		var formattedDate = month + "/" + date.getDate() + "/" + date.getFullYear() + " " + hour + ":" + minutes;
		if (todayDate.getTime() > date.getTime()) {
			subject += course + " Late Task Reminder"
			text += "Reminder to finish '" + req.body.name + "' for " + course + "!\n" + "Task is Late!\n" + "Due Date: " + formattedDate;
		} else {
			subject += course + " Late Task Reminder"
			text += "Reminder to finish '" + req.body.name + "' for " + course + "!\n" + "Due Date: " + formattedDate;
		}
	} else {
		subject += course + " Task Reminder"
		text += "Reminder to finish '" + req.body.name + "' for " + course + "!\n" + "Undated Task!";
	}
	mailOptions = {
		from: '"TA Management" <' + process.env.EMAIL_USERNAME + '>',
		to: recipients,
		subject: subject,
		text: text
	};

	var success;
	transporter.sendMail(mailOptions, function(error, info){
		if (error) {
			console.log(error);
			success = false;
		} else {
			console.log('Email sent: ' + info.response);
			success = true;
		}
	});
	res.json({ success: success });
}

// This function will be called to send reminders for all incomplete tasks.
// Will add email of each person associated with any incomplete task to the
// list of recipients.
async function sendMassReminder(req, res, dbClient, transporter) {
	var recipients = "";
	var course = "";
	var added = [];
	const incomplete = await dbClient.getIncompleteTasks();
	console.log(incomplete);

	for (var i = 0; i < incomplete.length; i++) {
		const user = await dbClient.getUserInfo(incomplete[i].dir_id);
		if (!added.includes(user[0].email)) {
			if (i === 0) {
				recipients += user[0].email;
				course = user[0].course;
				added.push(user[0].email);
			} else {
				recipients += ", " + user[0].email;
				added.push(user[0].email);
			}
		}
	}

	var subject = course + " Task Reminder";
	var text = "Reminder to finish any uncompleted tasks for " + course + "!";
	mailOptions = {
		from: '"TA Management" <' + process.env.EMAIL_USERNAME + '>',
		to: recipients,
		subject: subject,
		text: text
	};

	var success;
	transporter.sendMail(mailOptions, function(error, info){
		if (error) {
			console.log(error);
			success = false;
		} else {
			console.log('Email sent: ' + info.response);
			success = true;
		}
	});
	res.json({ success: success });

}

exports.sendReminder = sendReminder;
exports.sendMassReminder = sendMassReminder;
