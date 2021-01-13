import 'regenerator-runtime/runtime';
const Passwork = require('../../src/passwork-api');
const services = require('./services-web');

window.passwork = (host) => {
    return new Passwork(host, services)
}
