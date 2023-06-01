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
        let data = passworkLib.prepareAttachment(shortcutPassword, vault, attachmentPath, attachmentName);

        return request.post(`/sharing/shortcut/${shortcutId}/attachment`, data);
    }

    api.deleteShortcutPasswordAttachment = (shortcutId, attachmentId) =>
        request.delete(`/sharing/shortcut/${shortcutId}/attachment/${attachmentId}`);

    api.editShortcutPassword = async (shortcutId, fields = {}) => {
        const shortcutPassword = await api.getShortcutPassword(shortcutId);
        const vault = await api.getVault(shortcutPassword.shortcut.vaultId);
        const data = passworkLib.preparePasswordDataToEdit(shortcutPassword, vault, fields)

        return request.put(`/sharing/shortcut/${shortcutId}`, data);
    };

    api.deleteShortcut = async (shortcutId) => {
        return request.delete(`/sharing/shortcut/${shortcutId}`);
    };

};
