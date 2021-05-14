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
        host: host,
        token: '',
        masterPassword: false,
        useMasterPassword: false,
        debug: false,
    };

    this.setAuthOptions = (apiToken, masterPass = false) => {
        _options.token = apiToken;
        if (!!masterPass) {
            _options.masterPassword = false;
            _options.useMasterPassword = false;
        } else {
            _options.masterPassword = masterPass;
            _options.useMasterPassword = true;
        }
    }

    const request = new services.agent(_options).request;
    restModules.forEach(m => new m(_options, request, this, services));

};
