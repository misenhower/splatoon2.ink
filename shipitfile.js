require('dotenv').config();

module.exports = shipit => {
    shipit.initConfig({
        production: {
            servers: process.env.SHIPIT_PRODUCTION_SERVER,
            dir: process.env.SHIPIT_PRODUCTION_DIR,
        },
    });

    const dockerApp = 'sudo docker-compose exec app ';

    function options() {
        return { cwd: shipit.config.dir };
    }

    // Git

    shipit.blTask('pull', () => {
        return shipit.remote('git pull', options());
    });

    // JS

    shipit.blTask('install-js-deps', () => {
        return shipit.remote(dockerApp + 'yarn install --production', options());
    });

    shipit.blTask('build-js', ['install-js-deps'], () => {
        return shipit.remote(dockerApp + 'yarn run build', options());
    });

    shipit.blTask('deploy-js', [
        'pull',
        'build-js',
    ]);

    // App

    shipit.blTask('restart-app', () => {
        return shipit.remote('sudo docker-compose restart app', options());
    });

    // Combination Tasks

    shipit.blTask('deploy', [
        'pull',
        'deploy-js',
        'restart-app',
    ]);
}
