module.exports = function (options, api) {
    const superagent = require("superagent");
    const cryptoInterfaceFactory = require("../libs/crypt");
    const _method = {
        'POST':   (ep) => superagent.post(ep),
        'PUT':    (ep) => superagent.put(ep),
        'GET':    (ep) => superagent.get(ep),
        'DELETE': (ep) => superagent.delete(ep)

    }

    this.request = (endpoint, method, body) => new Promise((resolve, reject) => {
        let requestUrl = method + ': ' + options.host + endpoint;
        if (options.debug) {
            console.log(requestUrl);
        }

        if (endpoint.indexOf('/info/version') === -1 && endpoint.indexOf('/auth/login/') === -1) {
            api.updateSessionTtl();
        }

        _method[method](options.host + endpoint)
            .send(body)
            .set('Passwork-Auth', options.token)
            .set('Passwork-MasterHash', cryptoInterfaceFactory(options).hash(options.masterPassword))
            .set('Passwork-Lang', options.lang)
            .then(res => resolve(res.body.data))
            .catch(err => {
                err.endpoint = requestUrl;
                return reject(err);
            });
    });

    for (const key in _method) {
        this.request[key.toLowerCase()] = (endpoint, body) =>
            this.request(endpoint, key, body)
                .catch(e => {
                    throw {
                        httpRequest: e.endpoint,
                        httpStatus:  e.status,
                        httpMessage: e.message,
                        ...e.response.body
                    };
                });
    }
};
