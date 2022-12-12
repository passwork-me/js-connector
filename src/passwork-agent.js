module.exports = function (options) {
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


        _method[method](options.host + endpoint)
            .send(body)
            .set('Passwork-Auth', options.token)
            .set('Passwork-MasterHash', cryptoInterfaceFactory(options).hash(options.masterPassword))
            .set('Passwork-Lang', options.lang)
            .then(res => resolve(res.body.data))
            .catch(err => {
                err.endpoint = requestUrl;
                return reject(err);
            })
    });

    for (const key in _method) {
      this.request[key.toLowerCase()] = (endpoint, body) =>
        this.request(endpoint, key, body)
          .catch(this.handleApiSessionExpired)
          .then((data) => data === 'retry' ? this.request(endpoint, key, body) : data)
          .catch(this.handleError)
    }

    this.handleApiSessionExpired = (e) => {
      if (!!options.refreshToken && e.response && e.response.body && e.response.body.code === 'apiSessionExpired') {
        const token = options.token
        options.token = ''

        return this.request(`/auth/refreshToken/${token}/${options.refreshToken}`, 'POST').then(response => {
          options.token = response.token
          options.refreshToken = response.refreshToken

          return Promise.resolve('retry')
        })
      }

      return Promise.reject(e)
    }

    this.handleError = (e) => {
      if (e.response && e.response.body) {
        throw {
          httpRequest: e.endpoint,
          httpStatus:  e.status,
          httpMessage: e.message,
          ...e.response.body
        };
      } else {
        throw {
          httpRequest: e.endpoint,
          httpStatus:  'serverError',
          httpMessage: 'serverError',
        }
      }
    }
};
