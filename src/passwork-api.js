const restModules = [
    require("./rest-modules/passwords"),
    require("./rest-modules/users"),
    require("./rest-modules/vaults"),
    require("./rest-modules/folders")
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

    const request = new services.agent(_options).request;
    restModules.forEach(m => new m(_options, request, this, services));

};
