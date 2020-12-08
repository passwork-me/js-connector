const cryptoInterface = require("../../libs/crypt");

module.exports = function (options, request, api) {

    api.getDomain = () =>
        request.get('/vaults/domain');

    api.getVaults = () =>
        request.get('/vaults/list');

    api.getVault = (vaultId) =>
        request.get(`/vaults/${vaultId}`);

    api.getVaultFolders = (vaultId) =>
        request.get(`/vaults/${vaultId}/folders`);

    api.getVaultFullInfo = (vaultId) =>
        request.get(`/vaults/${vaultId}/fullInfo`);

    api.getVaultTags = (vaultId) =>
        request.get(`/vaults/${vaultId}/tags`);

    api.getVaultColors = (vaultId) =>
        request.get(`/vaults/${vaultId}/colors`);

    api.addVault = (name, isPrivate = false) => new Promise((resolve, reject) => {
        request.get('/vaults/domain').then(domain => {
            let data;
            if (options.useMasterPassword) {
                let groupPwd = cryptoInterface.generateString(32);
                let salt = cryptoInterface.generateString(32);
                data = {name, salt};
                if (isPrivate) {
                    data.passwordCrypted = cryptoInterface.encode(groupPwd, options.masterPassword)
                } else {
                    let domainMaster = cryptoInterface.decode(domain.mpCrypted, options.masterPassword)
                    data.mpCrypted = cryptoInterface.encode(groupPwd, domainMaster);
                }
                data.passwordHash = cryptoInterface.hash(groupPwd + salt)
            } else {
                data = {
                    name,
                    salt:         'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                    mpCrypted:    'YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE',
                    passwordHash: 'ffe054fe7ae0cb6dc65c3af9b61d5209f439851db43d0ba5997337df154668eb',
                }
            }
            if (!isPrivate) {
                data.domainId = domain.domainId;
            }
            return request.post(`/vaults`, data).then(vault => resolve(vault));
        })
    });

    api.editVault = (vaultId, name) => request.put(`/vaults/${vaultId}`, {name});

    api.deleteVault = (vaultId) => request.delete(`/vaults/${vaultId}`);
};
