echo "Please enter your name:"

read name

echo "Please enter your directory id:"

read userID

echo "Please enter the course name:"

read course

echo "Would you like to set a custom directory for file storage? (Yes or No)"

read files

if [ $files = "Yes" ] || [ $files = "yes" ]
then
	echo "Please enter the directory path for file storage (You can change this later in the .env file)"	
	read location
else
	location="./uploads"
fi

echo "Would you like to start the server after installation completes? (Yes or No)"

read startup

sudo mysqladmin -u root create $course

gunzip < mgmt.gz | sudo mysql -u root $course

rm mgmt.gz

sudo mysql -u root $course<<EOFMYSQL
INSERT INTO user (dir_id, name, role, course, email, tags) VALUES ('$userID', '$name', 'Admin', '$course', '$userID@umd.edu', '');
EOFMYSQL

sudo mysql -u root $course<<EOFMYSQL
CREATE USER 'spicymgmt'@'localhost' IDENTIFIED BY 'password';
EOFMYSQL

sudo mysql -u root $course<<EOFMYSQL
GRANT ALL PRIVILEGES ON $course.* TO 'spicymgmt'@'localhost';
ALTER USER 'spicymgmt'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';
FLUSH PRIVILEGES;
EOFMYSQL

cat > .env <<EOF

PORT=3000
EMAIL_USERNAME=spicyterpmgmt@gmail.com
EMAIL_PASSWORD=tamgmt&group4
EMAIL_SERVICE=gmail
DB_NAME=$course
DB_HOST=localhost
DB_USER=spicymgmt
DB_PASS=password
FILES_ROOT=$location

EOF

npm i
if [ $startup = 'Yes' ] || [ $startup = 'yes' ]
then
	node index.js
fi
