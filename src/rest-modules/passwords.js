const cryptoInterface = require("../../libs/crypt");
const fs = require("fs");
const path = require('path');


module.exports = function (options, request, api) {
    const passworkLib = require("../../libs/passwork")(options);

    const enrichPassword = (password, vault) => {
        password.getPassword = () => passworkLib.decryptString(password.cryptedPassword, vault);
    }

    const enrichAttachment = (attachment, vault) => {
        attachment.getData = () => passworkLib.decryptPasswordAttachment(attachment, vault)
        attachment.saveTo = (path, name = null) => {
            let fileName = name ? name : attachment.name;
            fs.writeFileSync(path + fileName, attachment.getData());
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
        if (additionalFields.hasOwnProperty('attachments') && additionalFields.attachments.length > 0) {
            additionalFields.attachments = passworkLib.formatAttachments(additionalFields.attachments, vault);
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
        if (fields.hasOwnProperty('attachments')) {
            fields.attachments = passworkLib.formatAttachments(fields.attachments, vault);
        }
        data = {...data, ...fields};

        return request.put(`/passwords/${passwordId}`, data);
    };

    api.deletePassword = (passwordId) =>
        request.delete(`/passwords/${passwordId}`);

    api.addPasswordAttachment = async (passwordId, attachmentPath, attachmentName = null) => {
        let password = await api.getPassword(passwordId);
        let vault = await api.getVault(password.vaultId);
        let data = passworkLib.encryptPasswordAttachment(fs.readFileSync(attachmentPath), vault)
        data.name = !attachmentName ? path.basename(attachmentPath) : attachmentName

        return request.post(`/passwords/${passwordId}/attachment`, data);
    }

    api.deletePasswordAttachment = (passwordId, attachmentId) =>
        request.delete(`/passwords/${passwordId}/attachment/${attachmentId}`)

    api.movePassword = async (passwordId, vaultId, folderId = null) => moveCopy(false, passwordId, vaultId, folderId);

    api.copyPassword = async (passwordId, vaultId, folderId = null) => moveCopy(true, passwordId, vaultId, folderId);

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
};