const env = require('dotenv').config().parsed;
const Passwork = require('./src/passwork-api');
/** @type PassworkAPI */
const passwork = new Passwork(env.HOST);

(async () => {
    try {
        await passwork.login(env.API_KEY, env.USER_MASTER_PASS);

        await require('./examples/vault').vaultExamples(passwork, env);
        await require('./examples/folder').folderExamples(passwork, env);
        await require('./examples/password').passwordExamples(passwork, env);
        await require('./examples/user').userExamples(passwork, env);
        await require('./examples/ftp-connection').examples(passwork);

        await passwork.logout();

    } catch (e) {
        console.error(e);
    }
})();
