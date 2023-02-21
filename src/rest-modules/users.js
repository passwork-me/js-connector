module.exports = function (options, request, api) {

    api.login = (apiKey, masterPassword = null) => {
        options.masterPassword = masterPassword ? masterPassword : false;
        options.useMasterPassword = !!masterPassword;
        let versionInfo;
        return new Promise((resolve, reject) => {
            api.version().then(info => {
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
            }).then(data => {
                api.loadMasterKey(options)
                  .then(masterKey => {
                      options.masterPassword = masterKey
                      resolve(data)
                  })
                  .catch(error => reject(error))
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

    api.extensionSecret = () => request.get('/user/extension-secret');

    api.userNotifications = (page = 1, limit = 10) => request.post('/user/notifications', {page, limit});

    api.userNotificationsCountNew = () => request.get('/user/notifications/count-new');

    api.userNotificationsMarkAsViewed = () => request.post('/user/notifications/mark-as-viewed');
};
