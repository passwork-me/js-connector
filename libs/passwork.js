const totp = require("totp-generator");
module.exports = (options, fileManager) => {
    const cryptoInterface = require("./crypt")(options);

    let self = {
        useKeyEncryption: (vault) => {
            return !!vault.vaultPasswordCrypted;
        },
        getVaultPassword: (vault) => {
            if (!options.useMasterPassword) {
                return '';
            }
            // vault.passwordCrypted — backward capability parameter
            const pass = vault.passwordCrypted || vault.vaultPasswordCrypted;
            if (vault.scope === 'domain') {
                let domainMaster = cryptoInterface.decode(vault.domainMaster, options.masterPassword);
                return cryptoInterface.decode(pass, domainMaster);
            } else {
                return cryptoInterface.decode(pass, options.masterPassword);
            }
        },
        getEncryptionKey: (passwordData, vaultPassword) => {
            if (!options.useMasterPassword) {
                return '';
            }
            if (passwordData.cryptedKey) {
                if (passwordData.shortcut) {
                    return cryptoInterface.decode(passwordData.shortcut.cryptedKey, vaultPassword);
                } else {
                    return cryptoInterface.decode(passwordData.cryptedKey, vaultPassword);
                }
            } else {
                return vaultPassword;
            }
        },
        encryptString:   (string, encryptionKey) => {
            if (options.useMasterPassword) {
                return cryptoInterface.encode(string, encryptionKey);
            }
            return cryptoInterface.base64encode(string)
        },
        decryptString:   (string, encryptionKey) => {
            if (options.useMasterPassword) {
                return cryptoInterface.decode(string, encryptionKey);
            }
            return cryptoInterface.base64decode(string)
        },
        encryptCustoms: (customFields, encryptionKey) => {
            return customFields.map(custom => {
                for (const field in custom) {
                    if (field !== 'name' && field !== 'value' && field !== 'type') {
                        return;
                    }
                    custom[field] = self.encryptString(custom[field], encryptionKey);
                }
                return custom;
            });
        },
        decryptCustoms: (customFields, encryptionKey) => {
            let result = [];
            for (const custom of customFields) {
                if (typeof custom === 'object' &&
                    custom !== null &&
                    custom.hasOwnProperty('name') &&
                    custom.hasOwnProperty('value') &&
                    custom.hasOwnProperty('type')) {
                    result.push({
                        name:  self.decryptString(custom.name, encryptionKey),
                        value: self.decryptString(custom.value, encryptionKey),
                        type:  self.decryptString(custom.type, encryptionKey),
                    });
                }
            }
            return result;
        },
        encryptPasswordAttachment: (buffer, passwordEncryptionKey) => {
            let arrayBuffer = new Int8Array(buffer);
            if (arrayBuffer.byteLength > 1024 * 1024 * 5) {
                throw "Attached file max size is 5MB";
            }
            let key, encryptedKey, encryptedData;
            if (options.useMasterPassword) {
                key = cryptoInterface.generatePasswordAttachmentKey();
                encryptedKey = cryptoInterface.encode(key, passwordEncryptionKey);
                encryptedData = cryptoInterface.encodeFile(arrayBuffer, key);
            } else {
                key = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
                encryptedKey = cryptoInterface.base64encode(key);
                encryptedData = cryptoInterface.encodeFile(arrayBuffer);
            }
            return {
                encryptedKey,
                encryptedData,
                hash: cryptoInterface.hash(cryptoInterface.getStringFromBlob(arrayBuffer)),
            };
        },
        decryptPasswordAttachment: (attachment, passwordEncryptionKey) => {
            let key = null;
            if (options.useMasterPassword) {
                key = cryptoInterface.decode(attachment.encryptedKey, passwordEncryptionKey);
            }
            let byteCharacters = cryptoInterface.decodeFile(attachment.encryptedData, key);
            if (cryptoInterface.hash(byteCharacters) !== attachment.hash) {
                throw "Can't decrypt attachment: hashes are not equal";
            }
            let byteNumbers = new Array(byteCharacters.length);
            for (let i = 0, l = byteCharacters.length; i < l; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            return Uint8Array.from(byteNumbers);
        },
        formatAttachments: (attachments, encryptionKey) => {
            const result = [];
            for (let {path, name} of attachments) {
                if (!path) {
                    continue;
                }
                try {
                    let data = self.encryptPasswordAttachment(fileManager.readFile(path), encryptionKey);
                    data.name = !name ? fileManager.getFileBasename(path) : name;
                    result.push(data);
                } catch (e) {
                }
            }
            return result;
        },
        enrichPassword: (password, vault) => {
            const encryptionKey = self.getEncryptionKey(password, self.getVaultPassword(vault));
            password.getPassword = () => self.decryptString(password.cryptedPassword, encryptionKey);
        },
        enrichAttachment: (password, attachment, vault) => {
            const encryptionKey = self.getEncryptionKey(password, self.getVaultPassword(vault));
            attachment.getData = () => self.decryptPasswordAttachment(attachment, encryptionKey);
            attachment.saveTo = (path, name = null) => {
                let fileName = name ? name : attachment.name;
                fileManager.saveToFile(path + fileName, attachment.getData());
            }
        },
        validateCustoms: (customs) => {
            if (customs.some(f => f.type === 'totp' && !cryptoInterface.isValidTotp(f.value))) {
                throw {code: 'invalidTotpFormat'};
            }
        },
        enrichCustoms: (password, vault) => {
            const encryptionKey = self.getEncryptionKey(password, self.getVaultPassword(vault));
            password.getCustoms = () => {
                if (!password.custom) {
                    return null;
                }

                let customs = self.decryptCustoms(password.custom, encryptionKey);
                customs.map(c => {
                    if (c.type === 'totp') {
                        c.getTotpCode = () => {
                            return totp(c.value);
                        };
                    }
                });

                return customs;
            }
        },
        preparePasswordDataToEdit: (password, vault, fields) => {
            const vaultPassword = self.getVaultPassword(vault);
            const encryptionKey = self.getEncryptionKey(password, vaultPassword)

            let data = {};
            if (fields.hasOwnProperty('password')) {
                data.cryptedPassword = self.encryptString(fields.password, encryptionKey);
                data.passwordFieldChanged = true;
                delete fields.password;
            }
            if (fields.hasOwnProperty('custom') && fields.custom.length > 0) {
                self.validateCustoms(fields.custom);
                fields.custom = self.encryptCustoms(fields.custom, encryptionKey);
            }
            if (fileManager.canUseFs && fields.hasOwnProperty('attachments')) {
                fields.attachments = self.formatAttachments(fields.attachments, encryptionKey);
            } else {
                delete fields.attachments;
            }
            fields.snapshot = self.makeSnapshot(password, vault);

            data = {...data, ...fields};

            return data;
        },

        makeSnapshot: (password, vault) => {
            const encryptionKey = self.getEncryptionKey(password, self.getVaultPassword(vault));
            let sData = {...password};
            self.enrichPassword(password, vault);
            self.enrichCustoms(password, vault);

            sData.password = password.getPassword();
            sData.custom = password.getCustoms();
            sData.groupId = sData.vaultId;
            if (sData.attachments && options.useMasterPassword) {
                sData.attachments = sData.attachments.map(function (att) {
                    return {
                        id:   att.id,
                        name: att.name,
                        key:  self.decryptString(att.encryptedKey, encryptionKey)
                    };
                });
            }

            const possibleFields = ['id', 'groupId', 'folderId', 'name', 'login', 'url', 'description', 'attachments',
                'color', 'tags', 'password', 'custom', 'lastPasswordUpdate'];
            for (const key in sData) {
                if (possibleFields.indexOf(key) < 0) {
                    delete sData[key];
                }
            }

            return self.encryptString(JSON.stringify(sData), encryptionKey);
        },
        prepareAttachment: (password, vault, attachmentPath, attachmentName) => {
            const passwordEncryptionKey = self.getEncryptionKey(password, self.getVaultPassword(vault))
            let data = self.encryptPasswordAttachment(fileManager.readFile(attachmentPath), passwordEncryptionKey)
            data.name = !attachmentName ? fileManager.getFileBasename(attachmentPath) : attachmentName
            return data;
        },
        prepareShareLinkData: (password, vault, reusable = false, time = 24, secret = null) => {
            const v5 =  Object.prototype.toString.call(time) === "[object String]";

            let oneTimePassword = null;
            if (options.useMasterPassword && (v5 || !secret)) {
                oneTimePassword = cryptoInterface.generateOneTimePassword();
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
                const encryptionKey = self.getEncryptionKey(password, self.getVaultPassword(vault));
                // Encode password, customs, attachments with one time password
                password.cryptedPassword = self.encryptString(password.getPassword(), oneTimePassword);
                if (password.custom && password.custom.length) {
                    password.custom = self.encryptCustoms(password.custom, oneTimePassword);
                }
                if (password.attachments && password.attachments.length) {
                    password.attachments.map(attachment => {
                        let key = self.decryptString(attachment.encryptedKey, encryptionKey);
                        attachment.encryptedKey = self.encryptString(key, oneTimePassword);
                    });
                }
                oneTimePasswordHash = cryptoInterface.hash(oneTimePassword);
            } else {
                password.password = password.getPassword();
                delete password.cryptedPassword;
            }

            let data;
            if (v5) {
                let type = reusable ? 'reusable' : 'onetime';
                const encryptionKey = self.getEncryptionKey(password, self.getVaultPassword(vault));
                if (oneTimePassword) {
                    oneTimePasswordCrypted = self.encryptString(oneTimePassword, encryptionKey);
                }
                data = {password, ttl: time, type, passwordHash: oneTimePasswordHash, oneTimePasswordCrypted};
            } else {
                data = {password, reusable, time: time, secretHash: oneTimePasswordHash};
            }

            return {data, oneTimePassword};
        },
    }

    return self;
};
