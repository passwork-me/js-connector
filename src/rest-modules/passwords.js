module.exports = function (options, request, api, {fileManager}) {
    const cryptoInterface = require("../../libs/crypt")(options);
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

    api.getPasswords = (vaultId = null, folderId = null) => {
        const ep = !!folderId ? `/folders/${folderId}/passwords` : `/vaults/${vaultId}/passwords`;
        return request.get(ep).then(res => res.sort((a, b) => a.name.localeCompare(b.name)));
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

    api.searchPasswords = (query, tags = [], colors = [], vaultId = null, includeShared = false) =>
        request.post('/passwords/search', {query, tags, colors, vaultId, includeShared});

    api.searchPasswordsByUrl = (url, includeShared) => request.post('/passwords/searchByUrl', {url, includeShared});

    api.getAttachment = async (passwordId, attachmentId) => {
        let password = await api.getPassword(passwordId);
        let vault = await api.getVault(password.vaultId);
        let attachment = await request.get(`/passwords/${passwordId}/attachment/${attachmentId}`);
        enrichAttachment(attachment, vault)
        return attachment;
    }

    api.addPassword = async (fields = {}) => {
        let vault = await api.getVault(fields.vaultId);

        fields.cryptedPassword = passworkLib.encryptString(fields.password, vault)
        delete fields.password;

        if (fields.hasOwnProperty('custom') && fields.custom.length > 0) {
            fields.custom = passworkLib.encryptCustoms(fields.custom, vault);
        }
        if (fileManager.canUseFs && fields.hasOwnProperty('attachments') && fields.attachments.length > 0) {
            fields.attachments = passworkLib.formatAttachments(fields.attachments, vault, fileManager);
        } else {
            delete fields.attachments;
        }

        return request.post('/passwords', fields);
    };

    api.editPassword = async (passwordId, fields = {}) => {
        let password = await request.get(`/passwords/${passwordId}`);
        let vault = await api.getVault(password.vaultId);
        let data = {};
        if (fields.hasOwnProperty('password')) {
            data.cryptedPassword = passworkLib.encryptString(fields.password, vault);
            data.passwordFieldChanged = true;
            delete fields.password;
        }
        if (fields.hasOwnProperty('custom') && fields.custom.length > 0) {
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

    api.getPasswordSharingInfo = async (passwordId) => request.get(`/passwords/${passwordId}/sharingInfo`);

    api.generatePasswordShareLink = async (passwordId, reusable = false, time = 24, secret = null) => {
        const password = await api.getPassword(passwordId);

        const v5 =  Object.prototype.toString.call(time) === "[object String]";

        let oneTimePassword = null;
        if (options.useMasterPassword && (v5 || !secret)) {
            oneTimePassword = cryptoInterface.generateString(32);
        }

        if (!v5) {
            if (!options.useMasterPassword) {
                oneTimePassword = null;
            } else {
                oneTimePassword = oneTimePassword? oneTimePassword : secret;
            }
        }

        if (password.custom && password.custom.length) {
            password.custom = password.getCustoms();
        }

        let oneTimePasswordHash = null;
        let oneTimePasswordCrypted = null;
        if (oneTimePassword) {
            password.cryptedPassword = password.getPassword();
            // Encode password, customs, attachments with one time password
            password.cryptedPassword = passworkLib.encryptString(password.cryptedPassword, null, oneTimePassword);
            if (password.custom && password.custom.length) {
                password.custom = passworkLib.encryptCustoms(password.custom, null, oneTimePassword);
            }
            if (password.attachments && password.attachments.length) {
                const vault = await api.getVault(password.vaultId);
                password.attachments.map(attachment => {
                    let key = passworkLib.decryptString(attachment.encryptedKey, vault);
                    attachment.encryptedKey = passworkLib.encryptString(key, null, oneTimePassword);
                });
            }
            oneTimePasswordHash = cryptoInterface.hash(oneTimePassword);
        }
        let data = null;
        if (v5) {
            let type = reusable ? 'reusable' : 'onetime';
            const vault = await api.getVault(password.vaultId);
            if (oneTimePassword) {
                oneTimePasswordCrypted = passworkLib.encryptString(oneTimePassword, vault);
            }
            data = {password, ttl: time, type, passwordHash: oneTimePasswordHash, oneTimePasswordCrypted};
        } else {
            data = {password, reusable, time: time, secretHash: oneTimePasswordHash};
        }
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
        const fetchPassword = async (firstTimeOpen, groupPasswordCrypted, privateCryptedKey) => {
            const requestData = {passwordCrypted: ''};
            // Send encrypted group password if inbox opened for the first time
            if (firstTimeOpen) {
                let groupPassword = '';
                if (!options.useMasterPassword) {
                    groupPassword = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
                } else if (groupPasswordCrypted && privateCryptedKey) {
                    const decryptedKey = cryptoInterface.decode(privateCryptedKey, options.masterPassword);
                    groupPassword = cryptoInterface.rsaDecrypt(groupPasswordCrypted, decryptedKey);
                }
                if (groupPassword) {
                    requestData.passwordCrypted = cryptoInterface.encode(groupPassword, options.masterPassword);
                    requestData.silent = false;
                }
            }
            return request.post(`/sharing/inbox/${inboxId}`, requestData);
        };

        let inboxPassword = await fetchPassword();
        if (!inboxPassword.viewed) {
            const user = await api.userInfo();
            inboxPassword = await fetchPassword(true, inboxPassword.groupPasswordCrypted, user.keys.privateCrypted);
        }

        const vault = await api.getVault(inboxPassword.vaultId);
        enrichPassword(inboxPassword.password, vault);
        enrichCustoms(inboxPassword.password, vault);

        return inboxPassword;
    };

    async function moveCopy(copy, passwordId, vaultTo, folderTo) {
        let action = copy ? 'copy' : 'move';
        let password = await api.getPassword(passwordId);
        let sourceVault = await api.getVault(password.vaultId);
        let targetVault = password.vaultId === vaultTo ? sourceVault : await api.getVault(vaultTo);
        let data = {passwordId, vaultTo, folderTo};
        data.cryptedPassword = passworkLib.encryptString(password.getPassword(), targetVault);
        if (password.hasOwnProperty('custom') && password.custom !== null) {
            let decryptCustoms = passworkLib.decryptCustoms(password.custom, sourceVault);
            data.custom = passworkLib.encryptCustoms(decryptCustoms, targetVault);
        }
        if (password.hasOwnProperty('attachments') && password.attachments !== null && password.attachments.length > 0) {
            data.attachments = [];
            for (let {id, name, encryptedKey} of password.attachments) {
                if (options.useMasterPassword) {
                    let key = cryptoInterface.decode(encryptedKey, passworkLib.getVaultMaster(sourceVault));
                    encryptedKey = cryptoInterface.encode(key, passworkLib.getVaultMaster(targetVault))
                }
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
        if (sData.attachments && options.useMasterPassword) {
            sData.attachments = sData.attachments.map(function (att) {
                return {id: att.id, name: att.name, key: cryptoInterface.decode(att.encryptedKey, vaultPass)};
            });
        }

        const possibleFields = ['id', 'groupId', 'folderId', 'name', 'login', 'url', 'description', 'attachments',
            'color', 'tags', 'password', 'custom', 'lastPasswordUpdate'];
        for (const key in sData) {
            if (possibleFields.indexOf(key) < 0) {
                delete sData[key];
            }
        }

        sData = JSON.stringify(sData);
        if (options.useMasterPassword) {
            sData = cryptoInterface.encode(sData, vaultPass);
        } else {
            sData = cryptoInterface.base64encode(sData);
        }
        return sData;
    }
};
