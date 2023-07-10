module.exports = function (options, request, api, {fileManager}) {
    const cryptoInterface = require("../../libs/crypt")(options);
    const passworkLib = require("../../libs/passwork")(options, fileManager);

    api.getPasswords = (vaultId = null, folderId = null) => {
        const ep = !!folderId ? `/folders/${folderId}/passwords` : `/vaults/${vaultId}/passwords`;
        return request.get(ep).then(res => res.sort((a, b) => a.name.localeCompare(b.name)));
    }

    api.getPassword = async (passwordId) => {
        let password = await request.get(`/passwords/${passwordId}`);
        let vault = await api.getVault(password.vaultId);
        passworkLib.enrichPassword(password, vault);
        passworkLib.enrichCustoms(password, vault);
        return password;
    }

    api.getRecentPasswords = () => request.get("/passwords/recent");

    api.getFavoritePasswords = () => request.get("/passwords/favorite");

    api.searchPasswords = (query, tags = [], colors = [], vaultId = null, includeShared = false, includeShortcuts = false) =>
        request.post('/passwords/search', {query, tags, colors, vaultId, includeShared, includeShortcuts});

    api.searchPasswordsByUrl = (url, includeShared = false, includeShortcuts = false) =>
        request.post('/passwords/searchByUrl', {url, includeShared, includeShortcuts});

    api.getAttachment = async (passwordId, attachmentId) => {
        let password = await api.getPassword(passwordId);
        let vault = await api.getVault(password.vaultId);
        let attachment = await request.get(`/passwords/${passwordId}/attachment/${attachmentId}`);
        passworkLib.enrichAttachment(password, attachment, vault);
        return attachment;
    };

    api.addPassword = async (fields = {}) => {
        const vault = await api.getVault(fields.vaultId);
        const vaultPassword = passworkLib.getVaultPassword(vault);
        const encryptionKey = passworkLib.useKeyEncryption(vault) ?
            cryptoInterface.generatePassword(32) : vaultPassword;

        fields.cryptedPassword = passworkLib.encryptString(fields.password, encryptionKey);
        if (passworkLib.useKeyEncryption(vault)) {
            fields.cryptedKey = passworkLib.encryptString(encryptionKey, vaultPassword);
        }
        delete fields.password;

        if (fields.hasOwnProperty('custom') && fields.custom.length > 0) {
            passworkLib.validateCustoms(fields.custom);
            fields.custom = passworkLib.encryptCustoms(fields.custom, encryptionKey);
        }
        if (fileManager.canUseFs && fields.hasOwnProperty('attachments') && fields.attachments.length > 0) {
            fields.attachments = passworkLib.formatAttachments(fields.attachments, encryptionKey, fileManager);
        } else {
            delete fields.attachments;
        }
        if (!fields.name) {
            fields.name = '';
        }

        return request.post('/passwords', fields);
    };

    api.editPassword = async (passwordId, fields = {}) => {
        const password = await request.get(`/passwords/${passwordId}`);
        const vault = await api.getVault(password.vaultId);
        const encryptionKey = passworkLib.getEncryptionKey(password, passworkLib.getVaultPassword(vault));
        const data = passworkLib.preparePasswordDataToEdit(password, encryptionKey, fields);

        return request.put(`/passwords/${passwordId}`, data);
    };

    api.deletePassword = async (passwordId) => {
        let password = await request.get(`/passwords/${passwordId}`);
        let vault = await api.getVault(password.vaultId);
        const encryptionKey = passworkLib.getEncryptionKey(password, passworkLib.getVaultPassword(vault));

        return request.delete(`/passwords/${passwordId}`, {snapshot: passworkLib.makeSnapshot(password, encryptionKey)});
    };

    api.addPasswordAttachment = async (passwordId, attachmentPath, attachmentName = null) => {
        let password = await api.getPassword(passwordId);
        let vault = await api.getVault(password.vaultId);
        const passwordEncryptionKey = passworkLib.getEncryptionKey(password, passworkLib.getVaultPassword(vault))
        let data = passworkLib.prepareAttachment(passwordEncryptionKey, attachmentPath, attachmentName);

        return request.post(`/passwords/${passwordId}/attachment`, data);
    }

    api.addPasswordWebAttachment = async (passwordId, file, attachmentName) => {
        const password = await api.getPassword(passwordId)
        const vault = await api.getVault(password.vaultId)
        const encryptionKey = passworkLib.getEncryptionKey(password, passworkLib.getVaultPassword(vault));
        const fr = new FileReader()
        fr.readAsArrayBuffer(file)
        fr.onload = () => {
            const data = passworkLib.encryptPasswordAttachment(fr.result, encryptionKey)
            data.name = file.name || attachmentName
            return request.post(`/passwords/${passwordId}/attachment`, data)
        }
    }

    api.deletePasswordAttachment = (passwordId, attachmentId) =>
        request.delete(`/passwords/${passwordId}/attachment/${attachmentId}`);

    api.movePassword = async (passwordId, vaultId, folderId = null) => moveCopy(false, passwordId, vaultId, folderId);

    api.copyPassword = async (passwordId, vaultId, folderId = null) => moveCopy(true, passwordId, vaultId, folderId);

    api.favoritePassword = async (passwordId) => request.post(`/passwords/${passwordId}/favorite`);

    api.unfavoritePassword = async (passwordId) => request.post(`/passwords/${passwordId}/unfavorite`);

    api.getPasswordSharingInfo = async (passwordId) => request.get(`/passwords/${passwordId}/sharingInfo`);

    api.generatePasswordShareLink = async (passwordId, reusable = false, time = 24, secret = null) => {
        const password = await api.getPassword(passwordId);
        const vault = await api.getVault(password.vaultId);
        const {data, oneTimePassword} = passworkLib.prepareShareLinkData(password, vault, reusable, time, secret);
        return request.post(`/passwords/generate-share-link`, data).then(res => {
            if (oneTimePassword) {
                return res + '#code=' + oneTimePassword;
            }
            return res;
        });
    };

    api.getInboxPasswords = () => request.get("/sharing/inbox/list");

    api.getInboxPasswordsCount = () => request.get("/sharing/inbox/count");

    api.getInboxPassword = async (inboxId) => {
        let inboxPassword = await request.post(`/sharing/inbox/${inboxId}`);

        if (inboxPassword.cryptedKey) {
            const encryptionKey = passworkLib.getInboxEncryptionKey(inboxPassword, await api.userInfo());
            passworkLib.enrichPassword(inboxPassword.password, null, encryptionKey);
            passworkLib.enrichCustoms(inboxPassword.password, null, encryptionKey);
        } else {
            const fetchPassword = async (firstTimeOpen, groupPasswordCrypted, privateCryptedKey) => {
                const requestData = {passwordCrypted: ''};
                if (firstTimeOpen) {
                    // Send encrypted group password if inbox opened for the first time
                    let groupPassword = '';
                    if (!options.useMasterPassword) {
                        groupPassword = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
                    } else if (groupPasswordCrypted && privateCryptedKey) {
                        const decryptedKey = passworkLib.decryptString(privateCryptedKey,options.masterPassword);
                        groupPassword = cryptoInterface.rsaDecrypt(groupPasswordCrypted, decryptedKey);
                    }
                    if (groupPassword) {
                        if (options.useMasterPassword) {
                            requestData.passwordCrypted = cryptoInterface.encode(groupPassword, options.masterPassword);
                        } else {
                            requestData.passwordCrypted = cryptoInterface.base64encode(groupPassword);
                        }
                        requestData.silent = false;
                    }
                }
                return request.post(`/sharing/inbox/${inboxId}`, requestData);
            };
            inboxPassword = await fetchPassword();
            if (!inboxPassword.viewed) {
                const user = await api.userInfo();
                const privateKey = options.useMasterPassword ? user.keys.privateCrypted : null;
                inboxPassword = await fetchPassword(true, inboxPassword.groupPasswordCrypted, privateKey);
            }
            const vault = await api.getVault(inboxPassword.vaultId);

            passworkLib.enrichPassword(inboxPassword.password, vault);
            passworkLib.enrichCustoms(inboxPassword.password, vault);
        }

        return inboxPassword;
    };
    api.editInboxPassword = async (inboxId, fields = {}) => {
        const inboxPassword = await request.post(`/sharing/inbox/${inboxId}`);

        if (!inboxPassword.cryptedKey) {
            // Backward capability (version < 5.4)
            return api.editPassword(inboxPassword.password.id, fields);
        }

        const encryptionKey = passworkLib.getInboxEncryptionKey(inboxPassword, await api.userInfo());
        const data = passworkLib.preparePasswordDataToEdit(inboxPassword.password, encryptionKey, fields);

        return request.put(`/passwords/${inboxPassword.password.id}`, data);
    };

    api.getInboxPasswordAttachment = async (inboxId, attachmentId) => {
        const inboxPassword = await request.post(`/sharing/inbox/${inboxId}`);

        if (!inboxPassword.cryptedKey) {
            // Backward capability (version < 5.4)
            return api.getAttachment(inboxPassword.password.id, attachmentId);
        }

        const attachment = await request.get(`/passwords/${inboxPassword.password.id}/attachment/${attachmentId}`);
        const encryptionKey = passworkLib.getInboxEncryptionKey(inboxPassword, await api.userInfo());
        passworkLib.enrichAttachment(null, attachment, null, encryptionKey);

        return attachment;
    };

    api.addInboxPasswordAttachment = async (inboxId, attachmentPath, attachmentName = null) => {
        const inboxPassword = await request.post(`/sharing/inbox/${inboxId}`);

        if (!inboxPassword.cryptedKey) {
            // Backward capability (version < 5.4)
            return api.addPasswordAttachment(inboxPassword.password.id, attachmentPath, attachmentName);
        }

        const encryptionKey = passworkLib.getInboxEncryptionKey(inboxPassword, await api.userInfo());
        let data = passworkLib.prepareAttachment(encryptionKey, attachmentPath, attachmentName);

        return request.post(`/passwords/${inboxPassword.password.id}/attachment`, data);
    };

    api.deleteInboxPasswordAttachment = async (inboxId, attachmentId) =>{
        const inboxPassword = await request.post(`/sharing/inbox/${inboxId}`);
        return request.delete(`/passwords/${inboxPassword.password.id}/attachment/${attachmentId}`)
    };

    api.inboxNotificationsCount = () => request.get('/sharing/inbox/notifications/count');

    api.inboxNotificationsMarkAsViewed = () => request.post('/sharing/inbox/notifications/mark-as-viewed');

    async function moveCopy(copy, passwordId, vaultTo, folderTo) {
        let action = copy ? 'copy' : 'move';
        let password = await api.getPassword(passwordId);
        let sourceVault = await api.getVault(password.vaultId);
        let targetVault = password.vaultId === vaultTo ? sourceVault : await api.getVault(vaultTo);
        let data = {passwordId, vaultTo, folderTo};
        const sourceEncryptionKey = passworkLib.getEncryptionKey(password, passworkLib.getVaultPassword(sourceVault));
        const targetEncryptionKey = passworkLib.useKeyEncryption(targetVault)
            ? sourceEncryptionKey
            : passworkLib.getVaultPassword(targetVault);

        data.cryptedPassword = passworkLib.encryptString(password.getPassword(), targetEncryptionKey);
        if (passworkLib.useKeyEncryption(targetVault)) {
            data.cryptedKey = passworkLib.encryptString(targetEncryptionKey, passworkLib.getVaultPassword(targetVault));
        }
        if (password.hasOwnProperty('custom') && password.custom !== null) {
            let decryptCustoms = passworkLib.decryptCustoms(password.custom, sourceEncryptionKey);
            data.custom = passworkLib.encryptCustoms(decryptCustoms, targetEncryptionKey);
        }
        if (password.hasOwnProperty('attachments') && password.attachments !== null && password.attachments.length > 0) {
            data.attachments = [];
            for (let {id, name, encryptedKey} of password.attachments) {
                if (options.useMasterPassword) {
                    let key = passworkLib.decryptString(encryptedKey, sourceEncryptionKey);
                    encryptedKey = passworkLib.encryptString(key, targetEncryptionKey)
                }
                data.attachments.push({id, name, encryptedKey});
            }
        }
        return request.post(`/passwords/${passwordId}/${action}`, data);
    }
};
