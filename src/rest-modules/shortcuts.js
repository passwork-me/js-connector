module.exports = function (options, request, api, {fileManager}) {
    const passworkLib = require("../../libs/passwork")(options, fileManager);

    api.getShortcutPassword = async (shortcutId) => {
        let password = await request.get(`/sharing/shortcut/${shortcutId}`);
        let vault = await api.getVault(password.shortcut.vaultId);
        passworkLib.enrichPassword(password, vault);
        passworkLib.enrichCustoms(password, vault);
        return password;
    }

    api.getShortcutPasswordAttachment = async (shortcutId, attachmentId) => {
        let shortcutPassword = await api.getShortcutPassword(shortcutId);
        let vault = await api.getVault(shortcutPassword.shortcut.vaultId);
        let attachment = await request.get(`/sharing/shortcut/${shortcutId}/attachment/${attachmentId}`);
        passworkLib.enrichAttachment(shortcutPassword, attachment, vault);
        return attachment;
    }

    api.addShortcutPasswordAttachment = async (shortcutId, attachmentPath, attachmentName = null) => {
        let shortcutPassword = await api.getShortcutPassword(shortcutId);
        let vault = await api.getVault(shortcutPassword.shortcut.vaultId);
        const passwordEncryptionKey = passworkLib.getEncryptionKey(shortcutPassword, passworkLib.getVaultPassword(vault))
        let data = passworkLib.prepareAttachment(passwordEncryptionKey, attachmentPath, attachmentName);

        return request.post(`/sharing/shortcut/${shortcutId}/attachment`, data);
    }

    api.deleteShortcutPasswordAttachment = (shortcutId, attachmentId) =>
        request.delete(`/sharing/shortcut/${shortcutId}/attachment/${attachmentId}`);

    api.editShortcutPassword = async (shortcutId, fields = {}) => {
        const shortcutPassword = await api.getShortcutPassword(shortcutId);
        const vault = await api.getVault(shortcutPassword.shortcut.vaultId);
        const encryptionKey = passworkLib.getEncryptionKey(shortcutPassword, passworkLib.getVaultPassword(vault));
        const data = passworkLib.preparePasswordDataToEdit(shortcutPassword, encryptionKey, fields)

        return request.put(`/sharing/shortcut/${shortcutId}`, data);
    };

    api.deleteShortcut = async (shortcutId) => {
        return request.delete(`/sharing/shortcut/${shortcutId}`);
    };

    api.moveShortcut = async (shortcutId, vaultId, folderId = null) => moveCopy('move', shortcutId, vaultId, folderId);

    api.copyShortcut = async (shortcutId, vaultId, folderId = null) => moveCopy('copy', shortcutId, vaultId, folderId);

    async function moveCopy(action, shortcutId, vaultTo, folderTo) {
        let shortcutPassword = await api.getShortcutPassword(shortcutId);
        let sc = shortcutPassword.shortcut;
        let sourceVault = await api.getVault(sc.vaultId);
        let targetVault = sc.vaultId === vaultTo ? sourceVault : await api.getVault(vaultTo);

        const encryptionKey = passworkLib.getEncryptionKey(shortcutPassword, passworkLib.getVaultPassword(sourceVault));
        const cryptedKey = passworkLib.encryptString(encryptionKey, passworkLib.getVaultPassword(targetVault));
        const data = {vaultTo, folderTo, cryptedKey};

        return request.post(`/sharing/shortcut/${shortcutId}/${action}`, data);
    }

    api.favoriteShortcut = async (shortcutId) => request.post(`/sharing/shortcut/${shortcutId}/favorite`);

    api.unfavoriteShortcut = async (shortcutId) => request.post(`/sharing/shortcut/${shortcutId}/unfavorite`);

    api.getShortcutPasswordSharingInfo = async (shortcutId) => request.get(`/sharing/shortcut/${shortcutId}/sharingInfo`);

    api.generateShortcutPasswordShareLink = async (shortcutId, reusable = false, time = 24, secret = null) => {
        let shortcutPassword = await api.getShortcutPassword(shortcutId);
        const vault = await api.getVault(shortcutPassword.shortcut.vaultId);
        const {data, oneTimePassword} = passworkLib.prepareShareLinkData(shortcutPassword, vault, reusable, time, secret);
        data.fromShortcut = true;
        data.shortcut = {id: shortcutId};

        return request.post(`/passwords/generate-share-link`, data).then(res => {
            if (oneTimePassword) {
                return res + '#code=' + oneTimePassword;
            }
            return res;
        });
    };
};
