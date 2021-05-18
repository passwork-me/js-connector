const cryptoInterface = require("../../libs/crypt");

module.exports = function (options, request, api, {fileManager}) {
    const passworkLib = require("../../libs/passwork")(options);

    const enrichPassword = (password, vault) => {
        password.getPassword = () => passworkLib.decryptString(password.cryptedPassword, vault);
    }

    const enrichAttachment = (attachment, vault) => {
        attachment.getData = () => passworkLib.decryptPasswordAttachment(attachment, vault);
        attachment.saveTo = (path, name = null) => {
            let fileName = name ? name : attachment.name;
            fileManager.saveToFile(path + fileName, attachment.getData());
        }
    }

    const enrichCustoms = (password, vault) => {
        password.getCustoms = () => {
            if (!password.custom) {
                return null;
            }
            return passworkLib.decryptCustoms(password.custom, vault);
        }
    }

    api.getPasswords = async (vaultId = null, folderId = null) => {
        const ep = !!folderId ? `/folders/${folderId}/passwords` : `/vaults/${vaultId}/passwords`;
        return await request.get(ep);
    }

    api.getPassword = async (passwordId) => {
        let password = await request.get(`/passwords/${passwordId}`);
        let vault = await api.getVault(password.vaultId);
        enrichPassword(password, vault);
        enrichCustoms(password, vault);
        return password;
    }

    api.getRecentPasswords = () => request.get("/passwords/recent");

    api.getFavoritePasswords = () => request.get("/passwords/favorite");

    api.searchPasswords = (query, tags = [], colors = [], vaultId = null) =>
        request.post('/passwords/search', {query, tags, colors, vaultId});

    api.getAttachment = async (passwordId, attachmentId) => {
        let password = await api.getPassword(passwordId);
        let vault = await api.getVault(password.vaultId);
        let attachment = await request.get(`/passwords/${passwordId}/attachment/${attachmentId}`);
        enrichAttachment(attachment, vault)
        return attachment;
    }

    api.addPassword = async (vaultId, name, login, password, additionalFields = {}) => {
        let vault = await api.getVault(vaultId);
        let data = {name, login, vaultId};
        data.cryptedPassword = passworkLib.encryptString(password, vault);
        if (additionalFields.hasOwnProperty('custom') && additionalFields.custom.length > 0) {
            additionalFields.custom = passworkLib.encryptCustoms(additionalFields.custom, vault);
        }
        if (fileManager.canUseFs && additionalFields.hasOwnProperty('attachments') && additionalFields.attachments.length > 0) {
            additionalFields.attachments = passworkLib.formatAttachments(additionalFields.attachments, vault, fileManager);
        } else {
            delete additionalFields.attachments;
        }
        data = {...data, ...additionalFields};

        return request.post('/passwords', data);
    };

    api.editPassword = async (passwordId, fields = {}) => {
        let password = await request.get(`/passwords/${passwordId}`);
        let vault = await api.getVault(password.vaultId);
        let data = {};
        if (fields.hasOwnProperty('password')) {
            data.cryptedPassword = passworkLib.encryptString(fields.password, vault);
        }
        if (fields.hasOwnProperty('custom') && additionalFields.custom.length > 0) {
            fields.custom = passworkLib.encryptCustoms(fields.custom, vault);
        }
        if (fileManager.canUseFs && fields.hasOwnProperty('attachments')) {
            fields.attachments = passworkLib.formatAttachments(fields.attachments, vault, fileManager);
        } else {
            delete fields.attachments;
        }
        fields.snapshot = makeSnapshot(password, vault);

        data = {...data, ...fields};

        return request.put(`/passwords/${passwordId}`, data);
    };

    api.deletePassword = async (passwordId) => {
        let password = await request.get(`/passwords/${passwordId}`);
        let vault = await api.getVault(password.vaultId);

        return request.delete(`/passwords/${passwordId}`, {
            snapshot: makeSnapshot(password, vault)
        });
    };

    api.addPasswordAttachment = async (passwordId, attachmentPath, attachmentName = null) => {
        let password = await api.getPassword(passwordId);
        let vault = await api.getVault(password.vaultId);
        let data = passworkLib.encryptPasswordAttachment(fileManager.readFile(attachmentPath), vault)
        data.name = !attachmentName ? fileManager.getFileBasename(attachmentPath) : attachmentName

        return request.post(`/passwords/${passwordId}/attachment`, data);
    }

    api.deletePasswordAttachment = (passwordId, attachmentId) =>
        request.delete(`/passwords/${passwordId}/attachment/${attachmentId}`);

    api.movePassword = async (passwordId, vaultId, folderId = null) => moveCopy(false, passwordId, vaultId, folderId);

    api.copyPassword = async (passwordId, vaultId, folderId = null) => moveCopy(true, passwordId, vaultId, folderId);

    api.favoritePassword = async (passwordId) => request.post(`/passwords/${passwordId}/favorite`);

    api.unfavoritePassword = async (passwordId) => request.post(`/passwords/${passwordId}/unfavorite`);

    async function moveCopy(copy, passwordId, vaultTo, folderTo) {
        let action = copy ? 'copy' : 'move';
        let password = await api.getPassword(passwordId);
        let sourceVault = await api.getVault(password.vaultId);
        let targetVault = password.vaultId === vaultTo ? sourceVault : await api.getVault(vaultTo);
        let data = {passwordId, vaultTo, folderTo};
        data.cryptedPassword = passworkLib.encryptString(password.getPassword(), targetVault);
        if (password.custom !== null) {
            let decryptCustoms = passworkLib.decryptCustoms(password.custom, sourceVault);
            data.custom = passworkLib.encryptCustoms(decryptCustoms, targetVault);
        }
        if (password.attachments !== null && password.attachments.length > 0) {
            data.attachments = [];
            for (let {id, name, encryptedKey} of password.attachments) {
                let key = cryptoInterface.decode(encryptedKey, passworkLib.getVaultMaster(sourceVault));
                encryptedKey = cryptoInterface.encode(key, passworkLib.getVaultMaster(targetVault))
                data.attachments.push({id, name, encryptedKey});
            }
        }
        return request.post(`/passwords/${passwordId}/${action}`, data);
    }

    function makeSnapshot(password, vault) {
        let vaultPass = passworkLib.getVaultMaster(vault)
        let sData = {...password};
        enrichPassword(password, vault);
        enrichCustoms(password, vault);

        sData.password = password.getPassword();
        sData.custom = password.getCustoms();
        sData.groupId = sData.vaultId;
        if (sData.attachments) {
            sData.attachments = sData.attachments.map(function (att) {
                return {id: att.id, name: att.name, key: cryptoInterface.decode(att.encryptedKey, vaultPass)};
            });
        }
        delete sData.cryptedPassword;
        delete sData.updatedAt;
        delete sData.vaultId;

        sData = JSON.stringify(sData);
        sData = cryptoInterface.encode(sData, vaultPass);
        return sData;
    }
};
