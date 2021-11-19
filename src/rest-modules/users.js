module.exports = function (options, request, api) {
    const passworkLib = require("../../libs/passwork")(options);

    api.login = (apiKey, masterPassword = null) => {
        api.setOptions({
            masterPassword:    masterPassword ? masterPassword : false,
            useMasterPassword: !!masterPassword,
        });
        let versionInfo;
        return new Promise((resolve, reject) => {
            api.version().then(info => {
                if (info.legacySupport) {
                    api.setOptions({hash: 'md5'});
                }
                versionInfo = info;
                return request.post(`/auth/login/${apiKey}`, {useMasterPassword: options.useMasterPassword});
            }).then(data => {
                const {token, tokenTtl, tokenExpiredAt} = data;
                const sessionCode = passworkLib.encryptSessionCode({
                    token, tokenTtl, tokenExpiredAt,
                    masterPassword: options.masterPassword,
                    legacySupport:  versionInfo.legacySupport
                });
                api.setOptions({token, tokenTtl, tokenExpiredAt, sessionCode});

                data.versionInfo = versionInfo;
                data.sessionCode = sessionCode;
                resolve(data);
            }).catch(err => {
                if (err.code === 'clientSideEncryptionDisabled') {
                    err.data.errorMessage = 'Do not use master password with disabled client side encryption'
                }
                reject(err);
            });
        });
    };

    api.logout = () => {
        return new Promise((resolve, reject) => {
            request.post('/auth/logout').then(() => {
                resolve()
            }).catch(err => reject(err));
        });
    };

    api.userInfo = () => request.get('/user/info');

    api.userNotifications = (page = 1, limit = 10) => request.post('/user/notifications', {page, limit});

    api.userNotificationsCountNew = () => request.get('/user/notifications/count-new');

    api.userNotificationsMarkAsViewed = () => request.post('/user/notifications/mark-as-viewed');
};
