import 'regenerator-runtime/runtime';
const Passwork = require('./../passwork-api');

window.passwork = (host) => {
    return new Passwork(host)
}
