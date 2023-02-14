module.exports = function (options, request, api) {
    const cryptoInterface = require("../../libs/crypt")(options);

    api.getDomain = () =>
        request.get('/vaults/domain');

    api.getVaults = () =>
        request.get('/vaults/list').then(res => res.sort((a, b) => a.name.localeCompare(b.name)));

    api.getVaultsCount = () => request.get('/vaults/count');

    api.getVault = (vaultId) =>
        request.get(`/vaults/${vaultId}`);

    api.getVaultFolders = (vaultId) =>
        request.get(`/vaults/${vaultId}/folders`).then(res => res.sort((a, b) => a.name.localeCompare(b.name)));

    api.getVaultFullInfo = (vaultId) =>
        request.get(`/vaults/${vaultId}/fullInfo`).then(res => {
            if (res.hasOwnProperty('folders')) {
                res.folders = res.folders.sort((a, b) => a.name.localeCompare(b.name))
            }
            if (res.hasOwnProperty('passwords')) {
                res.passwords = res.passwords.sort((a, b) => a.name.localeCompare(b.name))
            }

            return res;
        });

    api.getVaultSharingInfo = (vaultId) =>
        request.get(`/vaults/${vaultId}/sharingInfo`);

    api.getTags = () =>
        request.get(`/vaults/tags`);

    api.getColors = () =>
        request.get(`/vaults/colors`);

    api.getVaultTags = (vaultId) =>
        request.get(`/vaults/${vaultId}/tags`);

    api.getVaultColors = (vaultId) =>
        request.get(`/vaults/${vaultId}/colors`);

    api.addVault = (name, isPrivate = false) => request.get('/vaults/domain').then(domain => {
        let data;
        if (options.useMasterPassword) {
            let groupPwd = cryptoInterface.generateVaultMasterPassword();
            let salt = cryptoInterface.generateVaultSalt();
            data = {name, salt};
            if (isPrivate) {
                data.passwordCrypted = cryptoInterface.encode(groupPwd, options.masterPassword)
            }
            let domainMaster = cryptoInterface.decode(domain.mpCrypted, options.masterPassword)
            data.mpCrypted = cryptoInterface.encode(groupPwd, domainMaster);
            data.passwordHash = cryptoInterface.hash(groupPwd + salt)
        } else {
            data = {
                name,
                salt:            'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                passwordCrypted: 'YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE',
                mpCrypted:       'YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE',
                passwordHash:    'ffe054fe7ae0cb6dc65c3af9b61d5209f439851db43d0ba5997337df154668eb',
            }
        }
        if (!isPrivate) {
            data.domainId = domain.domainId;
        }
        return request.post(`/vaults`, data);
    });

    api.editVault = (vaultId, name) => request.put(`/vaults/${vaultId}`, {name});

    api.deleteVault = (vaultId) => request.delete(`/vaults/${vaultId}`);
};
