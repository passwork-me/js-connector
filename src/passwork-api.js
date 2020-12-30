const agent = require("./passwork-agent");

const restModules = [
    require("./rest-modules/passwords"),
    require("./rest-modules/users"),
    require("./rest-modules/vaults"),
    require("./rest-modules/folders")
];

/**
 * @param host
 * @implements PassworkAPI
 */
module.exports = function (host) {
    const _options = {
        host: host,
        token: '',
        masterPassword: false,
        useMasterPassword: false,
        debug: false

    };

    const request = new agent(_options).request;
    restModules.forEach(m => new m(_options, request, this));

};
