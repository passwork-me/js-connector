module.exports = function (options) {
    const axios = require('axios');
    const fetchAdapter = require("../libs/axios-fetch-adapter");
    // import fetchAdapter from "@vespaiach/axios-fetch-adapter";
    const cryptoInterfaceFactory = require("../libs/crypt");

    this.request = (endpoint, method, body) => new Promise((resolve, reject) => {
        let requestUrl = method + ': ' + options.host + endpoint;
        if (options.debug) {
            console.log(requestUrl);
        }

        let params = {
            url:     options.host + endpoint,
            method:  method,
            data:    body,
            headers: {
                'Passwork-Auth':       options.token,
                'Passwork-MasterHash': cryptoInterfaceFactory(options).hash(options.masterPassword),
                'Passwork-Lang':       options.lang,
            }
        };
        if (options.useFetchApi) {
            params.adapter = fetchAdapter
        }
        axios(params).then(res => resolve(res.data.data))
            .catch(err => {
                err.endpoint = requestUrl;
                return reject(err);
            });
    });

    ['post','put','get','delete'].forEach(method => {
        this.request[method] = (endpoint, body) =>
            this.request(endpoint, method, body)
                .catch(this.handleApiSessionExpired)
                .then((data) => data === 'retry' ? this.request(endpoint, key, body) : data)
                .catch(this.handleError)
    });

    this.handleApiSessionExpired = (e) => {
        if (!!options.refreshToken && e.response && e.response.body && e.response.body.code === 'apiSessionExpired') {
            const token = options.token;
            options.token = '';

            return this.request(`/auth/refreshToken/${token}/${options.refreshToken}`, 'POST').then(response => {
                options.token = response.token;
                options.refreshToken = response.refreshToken;

                return Promise.resolve('retry');
            })
        }

        return Promise.reject(e);
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
            };
        }
    }
};
