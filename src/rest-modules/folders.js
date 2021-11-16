module.exports = function (options, request, api) {
    const cryptoInterface = require("../../libs/crypt")(options);
    const passworkLib = require("../../libs/passwork")(options);

    api.getFolder = (folderId) =>
        request.get(`/folders/${folderId}`);

    api.getFolders = (vaultId) =>
        request.get(`/vaults/${vaultId}/folders`);

    api.getSubFolders = (folderId) =>
        request.get(`/folders/${folderId}/children`);

    api.addFolder = (vaultId, folderName, parentFolderId = null) => {
        return request.post('/folders', {
            name:     folderName,
            vaultId,
            parentId: parentFolderId,
        });
    };

    api.editFolder = (folderId, folderName, parentFolderId) => new Promise((resolve, reject) => {
        request.put(`/folders/${folderId}`, {
            name:     folderName,
            parentId: parentFolderId,
        }).then(res => resolve(res));
    });

    api.deleteFolder = (folderId) =>
        request.delete(`/folders/${folderId}`);

    api.searchFolders = (query) =>
        request.post('/folders/search', {query});

    api.moveFolder = async (folderId, vaultTo, folderTo = null) =>
        moveCopy(false, folderId, vaultTo, folderTo);

    api.copyFolder = async (folderId, vaultTo, folderTo = null) =>
        moveCopy(true, folderId, vaultTo, folderTo);

    async function moveCopy(copy, folderId, vaultTo, folderTo) {
        let action = copy ? 'copy' : 'move';
        let sourceVault = await api.getVault((await api.getFolder(folderId)).vaultId);
        let targetVault = sourceVault.id === vaultTo ? sourceVault : await api.getVault(vaultTo);
        let sourceVaultMaster = passworkLib.getVaultMaster(sourceVault);
        let targetVaultMaster = passworkLib.getVaultMaster(targetVault);
        let passwords = await getNestedPasswords(folderId);
        let data = {
            folderId, vaultTo, folderTo,
            cryptedPasswords: {}, custom: {}, attachments: {},
        };
        for (const {id} of passwords) {
            let password = await api.getPassword(id);
            data.cryptedPasswords[id] = passworkLib.encryptString(password.getPassword(), targetVault)
            if (password.hasOwnProperty('custom') && password.custom !== null) {
                let decryptCustoms = passworkLib.decryptCustoms(password.custom, sourceVault);
                data.custom[id] = passworkLib.encryptCustoms(decryptCustoms, targetVault);
            }
            if (password.hasOwnProperty('attachments') && password.attachments !== null && password.attachments.length > 0) {
                data.attachments[id] = [];
                for (let {id: attachmentId, name, encryptedKey} of password.attachments) {
                    let key = cryptoInterface.decode(encryptedKey, sourceVaultMaster);
                    encryptedKey = cryptoInterface.encode(key, targetVaultMaster)
                    data.attachments[id].push({id: attachmentId, name, encryptedKey});
                }
            }
        }
        return request.post(`/folders/${folderId}/${action}`, data);
    }

    async function getNestedPasswords(folderId) {
        let passwords = await api.getPasswords(null, folderId);
        let subFolders = await api.getSubFolders(folderId);
        if (subFolders.length > 0) {
            for (const subFolder of subFolders) {
                passwords = passwords.concat(await getNestedPasswords(subFolder.id));
            }
        }
        return passwords;
    }
};
