const shell = require('shelljs');

shell.exec('sed -i \'s/PLATFORM_JAVA_OPTS/#PLATFORM_JAVA_OPTS/\' .env');
shell.exec('docker-compose build');
