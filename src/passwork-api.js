const passworkLibFactory = require("../libs/passwork");
const restModules = [
    require("./rest-modules/passwords"),
    require("./rest-modules/users"),
    require("./rest-modules/vaults"),
    require("./rest-modules/folders"),
    require("./rest-modules/info"),
];

/**
 * @param host
 * @param services
 * @implements PassworkAPI
 */
module.exports = function (host, services = null) {
    if (!services) {
        services = require('./services');
    }
    const _options = {
        host:              host,
        token:             '',
        tokenTtl:          null,
        tokenExpiredAt:    null,
        masterPassword:    false,
        useMasterPassword: false,
        debug:             false,
        lang:              null,
        hash:              'sha256',
        sessionCode:       null,
    };

    this.setOptions = (data) => {
        if (!data) {
            return;
        }
        const availableOptions = [
            'masterPassword',
            'useMasterPassword',
            'lang',
            'token',
            'tokenTtl',
            'tokenExpiredAt',
            'sessionCode',
        ];
        for (const key in data) {
            if (data.hasOwnProperty(key) && availableOptions.indexOf(key) >= 0) {
                _options[key] = data[key];
            }
        }
        if (data.hasOwnProperty('hash') && ['sha256', 'md5'].indexOf(data.hash) >= 0) {
            _options.hash = data.hash;
        }
    };

    this.setAuthOptions = (apiToken, masterPass = false) => {
        if (!!masterPass) {
            this.setOptions({token: apiToken, masterPassword: masterPass, useMasterPassword: true});
        } else {
            this.setOptions({token: apiToken, masterPassword: false, useMasterPassword: false});
        }
    };

    this.getSessionCode = () => {
        return _options.sessionCode;
    };

    this.restoreSession = (sessionCode) => {
        let session;
        try {
            session = passworkLibFactory(_options).decryptSessionCode(sessionCode);
        } catch (e) {
            throw 'invalidSessionCode';
        }
        if (!session.tokenExpiredAt || session.tokenExpiredAt <= Math.floor(Date.now() / 1000)) {
            throw 'sessionExpired';
        }

        this.setOptions(session);
    };

    this.updateSessionTtl = () => {
        try {
            const session = passworkLibFactory(_options).decryptSessionCode(_options.sessionCode);
            session.tokenExpiredAt = Math.floor(Date.now() / 1000) + session.tokenTtl;
            _options.sessionCode = passworkLibFactory(_options).encryptSessionCode(session)
        } catch (e) {
        }
    };

    const request = new services.agent(_options, this).request;
    restModules.forEach(m => new m(_options, request, this, services));

};
