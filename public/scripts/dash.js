var Chart = require('chart.js');

function initDash(){
	initUserDisplay();
	getTasks();
}

function getTasks(){
	var url = "/api/tasks"
	$.ajax({
		type: "GET",
		url: url,
		success: function(response){
			console.log(response);
			window.tasks = response.data;
			populateDash(window.tasks);
		}
	});
}


//populate the dashboard with all completed, in progress, and late tasks. aims to allow the instructor to more easily see what has been
//done and what still needs to be done.
function populateDash(tasks){
	var myIncomplete = [];
	var myIncompleteTasks = "";
	var completedTasks = "";
	var progressTasks = "";
	var lateTasks = "";
	var progressBar = "";
	var progressBar2 = "";
	var progressBar3 = "";
	var undated = "";
	var undatedTasks = 0;
	var undatedTasksCompleted = 0;
	var numberIncomplete = 0;	//Used to count the amount of tasks not finished for the progress bar calculation
	var percentageIncomplete = 0;	//used to calculate total percentage for the progress bar
	var numberLate = 0;			//param for piegraph()
	var numberInprogress = 0;	//param for piegraph()
	var totalComplete = 0;		//param for piegraph()
	var liveTotal = 0;
	var liveComplete = 0;
	var todayDate = new Date();
	for (var i = 0; i < tasks.length; i++){
		var numberComplete = 0; 	//used for calculating percentage complete for late/incomplete tasks
		var task = tasks[i];
		if (task.due != null) {
			var date = new Date(task.due);
			var month = date.getMonth() + 1;
			var minutes = (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes());
			var hour = (date.getHours() < 10 ? "0" + date.getHours() : date.getHours());
			var formattedDate = month + "/" + date.getDate() + "/" + date.getFullYear() + " " + hour + ":" + minutes;
			var taskStatus = (task.completed ? "task-complete" : "task-incomplete");
			//Get total number of fully complete tasks
			if (taskStatus === "task-complete"){
				if(todayDate.getTime() < date.getTime()){
					liveTotal += 1;
					liveComplete += 100;
				}
				completedTasks += "<tr><td>" + task.name; + "</td></tr>";
				totalComplete += 1;
			}
			else {
				//Get number of completed Subtasks and increment 'numberComplete' (used to calculate % complete later)
				for (var j = 0; j < task.subtasks.length; j++) {
					var subtask = task.subtasks[j];
					for (var k = 0; k < subtask.assignedTo.length; k++) {
						if (subtask.assignedTo[k].dir_id == window.currUser.dir_id && !subtask.assignedTo[k].completed) {
							if (!myIncomplete.includes(task.task_id)) {
								myIncomplete.push(task.task_id);
								myIncompleteTasks += "<tr><td>" + task.name; + "</td></tr>";
							}
						}
					}
					var subtaskStatus = (subtask.completed ? "Completed" : "In Progress");
					if (subtaskStatus === "Completed"){
						numberComplete += 1;
					}
				}
				//Late tasks
				//Check if task is Late or not by comparing the Times
				if (todayDate.getTime() > date.getTime()) {
					if (task.subtasks.length > 0){
						var percentageComplete = (numberComplete / task.subtasks.length) * 100;
						var num = percentageComplete.toFixed(1);
					} else {
						var num = 0;
					}
					lateTasks += "<tr>";
					lateTasks += "<td>" + task.name + "</td>";
					lateTasks += "<td><progress value='" + num + "' max='100'></progress>     " + num + "%</td>";
					lateTasks += "<td>" + formattedDate + "</td>";
					lateTasks += "</tr>"
					numberLate += 1;
					numberIncomplete += 1;
					percentageIncomplete = +percentageIncomplete + +num;
				}
				//In Progress Tasks
				else {
					if (task.subtasks.length > 0){
						var percentageComplete = (numberComplete / task.subtasks.length) * 100;
						var num = percentageComplete.toFixed(1);
					} else {
						var num = 0;
					}
					progressTasks += "<tr>";
					progressTasks += "<td>" + task.name + "</td>";
					progressTasks += "<td><progress value='" + num + "' max='100'></progress>     " + num + "%</td>";
					progressTasks += "<td>" + formattedDate + "</td>";
					progressTasks += "</tr>"
					numberInprogress += 1;
					numberIncomplete += 1;
					liveTotal += 1;
					percentageIncomplete = +percentageIncomplete + +num;
				}
			}
		} else {
			undatedTasks += 1;
			var taskStatus = (task.completed ? "task-complete" : "task-incomplete");
			if (taskStatus === "task-complete") {
				undatedTasksCompleted += 1;
				totalComplete += 1;
			} else {
				for (var j = 0; j < task.subtasks.length; j++) {
					var subtask = task.subtasks[j];
					var subtaskStatus = (subtask.completed ? "Completed" : "In Progress");
					if (subtaskStatus === "Completed"){
						numberComplete += 1;
					}
				}
				if (task.subtasks.length > 0){
					var percentageComplete = (numberComplete / task.subtasks.length) * 100;
					var num = percentageComplete.toFixed(1);
				} else {
					var num = 0;
				}
				undated += "<tr>";
				undated += "<td>" + task.name + "</td>";
				undated += "<td><progress value='" + num + "' max='100'></progress>     " + num + "%</td>";
				undated += "</tr>"
				numberInprogress += 1;
				numberIncomplete += 1;
				liveTotal += 1;
				percentageIncomplete = +percentageIncomplete + +num;
			}
		}
	}
	//Create progress bar in three cases: 0%, 1-99%, 100%:
	//Get progress bar complete % by doing (percentageIncomplete)/(numberIncomplete)
	if (numberIncomplete > 0){
		var temp = (percentageIncomplete / numberIncomplete);
		temp = temp.toFixed(1);
		if (temp == 0){			//0% of tasks complete
			progressBar += "<div class='progress-bar bg-danger' role='progressbar' aria-valuenow='";
			progressBar += 100 + "' aria-valuemin='0' aria-valuemax='100' style='width:";
			progressBar += 100 + "%'>" + 0 + "%</div>";
		} else {				//1-99% of tasks complete
			progressBar += "<div class='progress-bar bg-warning' role='progressbar' aria-valuenow='";
			progressBar += temp + "' aria-valuemin='0' aria-valuemax='100' style='width:";
			progressBar += temp + "%'>" + temp + "%</div>";
		}
	} else{						//100% of tasks complete
		progressBar += "<div class='progress-bar bg-success' role='progressbar' aria-valuenow='";
		progressBar += 100 + "' aria-valuemin='0' aria-valuemax='100' style='width:";
		progressBar += 100 + "%'>" + 100 + "%</div>";
	}
	if (liveTotal > 0){
		var temp = (liveComplete / liveTotal);
		temp = temp.toFixed(1);
		if (temp == 0){
			progressBar2 += "<div class='progress-bar bg-danger' role='progressbar' aria-valuenow='";
			progressBar2 += 100 + "' aria-valuemin='0' aria-valuemax='100' style='width:";
			progressBar2 += 100 + "%'>" + 0 + "%</div>";
		}
		else if (temp == 100){
			progressBar2 += "<div class='progress-bar bg-success' role='progressbar' aria-valuenow='";
			progressBar2 += 100 + "' aria-valuemin='0' aria-valuemax='100' style='width:";
			progressBar2 += 100 + "%'>" + 100 + "%</div>";
		} else{
			progressBar2 += "<div class='progress-bar bg-warning' role='progressbar' aria-valuenow='";
			progressBar2 += temp + "' aria-valuemin='0' aria-valuemax='100' style='width:";
			progressBar2 += temp + "%'>" + temp + "%</div>";
		}
	} else {
		progressBar2 += "<div class='progress-bar bg-success' role='progressbar' aria-valuenow='";
		progressBar2 += 100 + "' aria-valuemin='0' aria-valuemax='100' style='width:";
		progressBar2 += 100 + "%'>" + 100 + "%</div>";
	}
	if (undatedTasks > 0){
		var temp = (undatedTasksCompleted / undatedTasks);
		temp = temp.toFixed(1);
		temp = temp * 100;
		if (temp == 0){
			progressBar3 += "<div class='progress-bar bg-danger' role='progressbar' aria-valuenow='";
			progressBar3 += 100 + "' aria-valuemin='0' aria-valuemax='100' style='width:";
			progressBar3 += 100 + "%'>" + 0 + "%</div>";
		}
		else if (temp == 100){
			progressBar3 += "<div class='progress-bar bg-success' role='progressbar' aria-valuenow='";
			progressBar3 += 100 + "' aria-valuemin='0' aria-valuemax='100' style='width:";
			progressBar3 += 100 + "%'>" + 100 + "%</div>";
		} else {
			progressBar3 += "<div class='progress-bar bg-warning' role='progressbar' aria-valuenow='";
			progressBar3 += temp + "' aria-valuemin='0' aria-valuemax='100' style='width:";
			progressBar3 += temp + "%'>" + temp + "%</div>";
		}
	} else {
		progressBar3 += "<div class='progress-bar bg-success' role='progressbar' aria-valuenow='";
		progressBar3 += 100 + "' aria-valuemin='0' aria-valuemax='100' style='width:";
		progressBar3 += 100 + "%'>" + 100 + "%</div>";
	}
	//Change the innerHTMLs to create the three tables and the progress bar. Calls pieChart()
	document.getElementById("completed-tasks").innerHTML = completedTasks;
	document.getElementById("inProgress-tasks").innerHTML = progressTasks;
	document.getElementById("late-tasks").innerHTML = lateTasks;
	document.getElementById("undated-tasks").innerHTML = undated;
	document.getElementById("my-incomplete-tasks").innerHTML = myIncompleteTasks;
	document.getElementById("progress-bar").innerHTML = progressBar;
	document.getElementById("progress-bar2").innerHTML = progressBar2;
	document.getElementById("progress-bar3").innerHTML = progressBar3;
	pieChart(totalComplete, numberInprogress, numberLate);		//call piechart with the amount of tasks complete, in progress, and late
}

function pieChart(complete, inprogress, late) {
	var ctx = document.getElementById("pie-chart");
	var myChart = new Chart(ctx, {
		type: 'pie',
		data: {
			labels: ["Complete", "In Progress", "Late"],
			datasets: [
				{
					label: 'All Tasks',
					data: [complete, inprogress, late],
					backgroundColor :[
						'rgba(40, 255, 40, .5)',
						'rgba(255, 206, 86, .5)',
						'rgba(255, 99, 132, .5)'
					],
					borderColor: [
						'rgba(40,255,40,1)',
						'rgba(255, 206, 86, 1)',
						'rgba(255, 99, 132, 1)'
					],
					borderWidth : 1
				}
			]
		},
		options: {
			responsive: false,
		}
	});
}
