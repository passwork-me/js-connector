const cryptoInterfaceFactory = require('../libs/crypt')
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
        refreshToken:      '',
        masterPassword:    false,
        useMasterPassword: false,
        debug:             false,
        lang:              null,
        hash:              'sha256',
    };

    this.setAuthOptions = (apiToken, masterPass = false) => {
        return new Promise((resolve, reject) => {
            if (typeof apiToken === 'string') {
                apiToken = {token: apiToken};
            }

            _options.token = apiToken.token;
            _options.refreshToken = apiToken.refreshToken ? apiToken.refreshToken : '';

            if (!!masterPass) {
                _options.masterPassword = masterPass;
                _options.useMasterPassword = true;
            } else {
                _options.masterPassword = false;
                _options.useMasterPassword = false;
            }

            this.loadMasterKey(_options)
              .then(masterKey => {
                  _options.masterPassword = masterKey
                  resolve()
              })
              .catch(error => {
                  reject(error)
              })
        })
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

    this.loadMasterKey = (options) => {
        return new Promise((resolve, reject) => {
            if (!options.useMasterPassword) {
                resolve(false);
                return;
            }

            request.get('/user/get-master-key-options').then(data => {
                if (!data || !data.mkOptions) {
                    resolve(options.masterPassword);

                    return;
                }

                const cryptoFactory = cryptoInterfaceFactory(options);
                const hashOptions = cryptoFactory.parseOptions(data.mkOptions);
                cryptoFactory.createSaltedHash(options.masterPassword, hashOptions, (masterKey) => {
                    resolve(masterKey);
                })
            }).catch(err => {
                if (err && err.httpStatus === 404) {
                    resolve(options.masterPassword);
                    return;
                }

                return reject(err)
            });
        })
    }

};
