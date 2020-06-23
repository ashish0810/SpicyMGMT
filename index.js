var express = require('express');
var cas = require('connect-cas');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var multer = require('multer');
var fs = require('fs');

var frontendRoutes = require('./routes/frontendRoutes');
var backendRoutes = require('./routes/backendRoutes');
var casRoutes = require('./routes/casRoutes');

var MySqlClient = require('./utils/database/mySqlClient');

require('dotenv').config();

cas.configure({ 'host': 'login.umd.edu' });

var app = express();

app.use(morgan(function (tokens, req, res) {
	var user = (req.session && req.session.cas) ? req.session.cas.user : "Not Logged In";
	return [
		user,
		tokens.method(req, res),
		tokens.url(req, res),
		tokens.status(req, res),
		tokens.res(req, res, 'content-length'), '-',
		tokens['response-time'](req, res), 'ms'
	].join(' ')
}));

// To use JSON
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Use cookie sessions for simplicity, can use something else
// We should change the secret and the keys later
app.use(cookieParser('this should be random and secure'));
app.use(cookieSession({
	httpOnly: false,
	keys: ['key1', 'key2'],
	maxAge: 16 * 60 * 60 * 1000
}));

try {
	if (!fs.existsSync('./temp')){
		fs.mkdirSync('./temp');
	}
	if (!fs.existsSync(process.env.FILES_ROOT)){
		fs.mkdirSync(process.env.FILES_ROOT);
	}
} catch (err) {
	console.error(err)
}

//storage determines where these files will be uploaded to
var storage = multer.diskStorage({
	destination: function (req, file, cb) { cb(null, './temp'); },
	filename: function (req, file, cb) { cb(null, file.originalname); }
});
var upload = multer({ storage: storage});

// Initialize database client. Using MySqlClient on localhost by default
// We will still keep the local client, but will only use it when arg is specified
var dbClient;
if (process.argv[2] == 'vm') {
	dbClient = new MySqlClient('veinule.cs.umd.edu', 'groupUser', 'pass', 'testdb');
} else if (process.argv[2] == 'localsql') {
	dbClient = new MySqlClient('localhost', 'groupUser', 'pass', 'mgmt');
} else {
	dbClient = new MySqlClient(process.env.DB_HOST, process.env.DB_USER, process.env.DB_PASS, process.env.DB_NAME);
}

// Initialize transporter used for email
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
	service: process.env.EMAIL_SERVICE,
	auth: {
		user: process.env.EMAIL_USERNAME,
		pass: process.env.EMAIL_PASSWORD
	}
});

// These functions setup the routes
// Just makes it cleaner and separates different parts
frontendRoutes(app, dbClient);
backendRoutes(app, dbClient, transporter, upload);
casRoutes(app, cas);

var port = process.env.PORT || 3000;
app.listen(port, () => {
	console.log(`Listening on port ${port}...`);
});
