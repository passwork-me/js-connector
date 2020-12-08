const superagent = require("superagent");
const cryptoInterface = require("../libs/crypt");


module.exports = function (options) {
    const _method = {
        'POST':   (ep) => superagent.post(ep),
        'PUT':    (ep) => superagent.put(ep),
        'GET':    (ep) => superagent.get(ep),
        'DELETE': (ep) => superagent.delete(ep)

    }

    this.request = (endpoint, method, body) => new Promise((resolve, reject) => {
        console.log(method + ': ' + options.host + endpoint);
        _method[method](options.host + endpoint)
            .send(body)
            .set('Passwork-Auth', options.token)
            .set('Passwork-MasterHash', cryptoInterface.hash(options.masterPassword))
            .then(res => resolve(res.body.data))
            .catch(err => reject(err))
    });

    for (const key in _method) {
        this.request[key.toLowerCase()] = (endpoint, body, success, error) =>
            this.request(endpoint, key, body, success, error).catch(e => console.error(e.response.body));
    }
};
