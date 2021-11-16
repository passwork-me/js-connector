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
        masterPassword:    false,
        useMasterPassword: false,
        debug:             false,
        lang:              null,
        hash:              'sha256',
    };

    this.setAuthOptions = (apiToken, masterPass = false) => {
        _options.token = apiToken;
        if (!!masterPass) {
            _options.masterPassword = masterPass;
            _options.useMasterPassword = true;
        } else {
            _options.masterPassword = false;
            _options.useMasterPassword = false;
        }
    };

    this.setOptions = (options) => {
        if (!options) {
            return;
        }
        if (options.hasOwnProperty('lang')) {
            _options.lang = options.lang;
        }
        if (options.hasOwnProperty('hash') && ['sha256', 'md5'].indexOf(options.hash) >= 0) {
            _options.hash = options.hash;
        }
    };

    const request = new services.agent(_options).request;
    restModules.forEach(m => new m(_options, request, this, services));

};
