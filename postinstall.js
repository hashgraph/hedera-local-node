const shell = require('shelljs');

/*
Neither of the below items are currently needed. The `PLATFORM_JAVA_OPTS` should not be commented out and the current
docker compose definitions do not support inline builds.
*/

// shell.exec('sed -i \'s/PLATFORM_JAVA_OPTS/#PLATFORM_JAVA_OPTS/\' .env');
// shell.exec('docker-compose build');
