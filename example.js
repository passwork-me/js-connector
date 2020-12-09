const env = require('dotenv').config().parsed;
const Passwork = require('./src/passwork-api');
/** @type PassworkAPI */
const passwork = new Passwork(env.HOST);

(async () => {
    try {
        await passwork.login(env.API_KEY, env.USER_MASTER_PASS);

        await require('./examples/vault').examples(passwork);
        await require('./examples/folder').examples(passwork);
        await require('./examples/password').examples(passwork);
        await require('./examples/ftp-connection').examples(passwork);

        await passwork.logout();

    } catch (e) {
        console.error(e);
    }
})();
