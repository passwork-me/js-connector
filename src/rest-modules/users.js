module.exports = function (options, request, api) {

    function login(apiKey, master) {
        options.masterPassword = master ? master : false;
        options.useMasterPassword = !!master;

        let versionInfo;
        return api.version().then(info => {
            if (info.legacySupport) {
                api.setOptions({hash: 'md5'});
            }
            versionInfo = info;
            return request.post(`/auth/login/${apiKey}`, {useMasterPassword: options.useMasterPassword});
        }).then(data => {
            options.token = data.token;
            options.refreshToken = data.refreshToken ? data.refreshToken : '';
            data.versionInfo = versionInfo;
            return data;
        })
    }

    function handleLoginError(err) {
        if (err.code === 'clientSideEncryptionDisabled') {
            err.data.errorMessage = 'Do not use master password with disabled client side encryption'
        }
        throw err;
    }

    api.login = (apiKey, masterPassword = null) => {
        return new Promise((resolve, reject) => {
            login(apiKey, masterPassword).then(data => {
                api.loadMasterKey(options).then(masterKey => {
                    options.masterPassword = masterKey;
                    resolve(data);
                }).catch(error => reject(error));
            }).catch(handleLoginError).catch((e) => reject(e));
        });
    };

    api.loginWithKey = (apiKey, masterKey = null) => {
        return login(apiKey, masterKey).catch(handleLoginError);
    };

    api.logout = () => {
        return new Promise((resolve, reject) => {
            request.post('/auth/logout').then(() => {
                resolve()
            }).catch(err => reject(err));
        });
    };

    api.userInfo = () => request.get('/user/info');

    api.extensionSecret = () => request.get('/user/extension-secret');

    api.userNotifications = (page = 1, limit = 10) => request.post('/user/notifications', {page, limit});

    api.userNotificationsCountNew = () => request.get('/user/notifications/count-new');

    api.userNotificationsMarkAsViewed = () => request.post('/user/notifications/mark-as-viewed');
};
