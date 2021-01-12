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
};
