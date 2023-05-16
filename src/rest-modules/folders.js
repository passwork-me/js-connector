module.exports = function (options, request, api) {
    const cryptoInterface = require("../../libs/crypt")(options);
    const passworkLib = require("../../libs/passwork")(options);

    api.getFolder = (folderId) =>
        request.get(`/folders/${folderId}`);

    api.getFolders = (vaultId) =>
        request.get(`/vaults/${vaultId}/folders`).then(res => res.sort((a, b) => a.name.localeCompare(b.name)));

    api.getSubFolders = (folderId) =>
        request.get(`/folders/${folderId}/children`).then(res => res.sort((a, b) => a.name.localeCompare(b.name)));

    api.addFolder = (vaultId, folderName, parentFolderId = null) => {
        return request.post('/folders', {
            name:     folderName,
            vaultId,
            parentId: parentFolderId,
        });
    };

    api.editFolder = (folderId, folderName, parentFolderId) => {
        return request.put(`/folders/${folderId}`, {
            name:     folderName,
            parentId: parentFolderId,
        });
    };

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
        let passwords = await getNestedPasswords(folderId);
        let data = {
            folderId, vaultTo, folderTo,
            cryptedPasswords: {}, cryptedKeys: {}, custom: {}, attachments: {},
        };
        for (const {id} of passwords) {
            let password = await api.getPassword(id);
            const sourceEncryptionKey = passworkLib.getEncryptionKey(password, passworkLib.getVaultPassword(sourceVault));
            const targetEncryptionKey = passworkLib.getEncryptionKey(password, passworkLib.getVaultPassword(targetVault));
            data.cryptedPasswords[id] = passworkLib.encryptString(password.getPassword(), targetEncryptionKey)
            if (passworkLib.useKeyEncryption(targetVault)) {
                data.cryptedKeys[id] = passworkLib.encryptString(targetEncryptionKey, passworkLib.getVaultPassword(targetVault));
            }
            if (password.hasOwnProperty('custom') && password.custom !== null) {
                let decryptCustoms = passworkLib.decryptCustoms(password.custom, sourceEncryptionKey);
                data.custom[id] = passworkLib.encryptCustoms(decryptCustoms, targetEncryptionKey);
            }
            if (password.hasOwnProperty('attachments') && password.attachments !== null && password.attachments.length > 0) {
                data.attachments[id] = [];
                for (let {id: attachmentId, name, encryptedKey} of password.attachments) {
                    if (options.useMasterPassword) {
                        let key = passworkLib.decryptString(encryptedKey, sourceEncryptionKey);
                        encryptedKey = passworkLib.encryptString(key, targetEncryptionKey);
                    }
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
