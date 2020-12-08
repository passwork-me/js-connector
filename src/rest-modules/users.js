const cryptoInterface = require("../../libs/crypt");

module.exports = function (options, request, api) {

    api.login = (apiKey, masterPassword = null) => {
        options.masterPassword = masterPassword ? masterPassword : false;
        options.useMasterPassword = !!masterPassword;
        return new Promise((resolve, reject) => {
            request.post(`/auth/login/${apiKey}`).then(data => {
                options.token = data.token;
                resolve(data);
            }).catch(err => reject(err));
        });
    }

    api.logout = () => {
        return new Promise((resolve, reject) => {
            request.post('/auth/logout').then(() => {
                resolve()
            }).catch(err => reject(err));
        });
    }

    // api.register = (login, password, notificationEmail = '', masterPassword = null) => new Promise((resolve, reject) => {
    //     let data = {
    //         login,
    //         password,
    //         crypto: null,
    //     };
    //     cryptoInterface.generateRsaKeysForNewUser(masterPassword, (pub, priv) => {
    //         if (!!masterPassword) {
    //             data.crypto = cryptoInterface.hash(masterPassword);
    //             data.keys = {
    //                 public:         pub,
    //                 privateCrypted: priv
    //             }
    //         }
    //         request.post('/auth/register', data).then(res => resolve(res));
    //     });
    // })
};
