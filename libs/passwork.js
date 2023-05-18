module.exports = options => {
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
                return cryptoInterface.decode(passwordData.cryptedKey, vaultPassword);
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
                result.push({
                    name:  self.decryptString(custom.name, encryptionKey),
                    value: self.decryptString(custom.value, encryptionKey),
                    type:  self.decryptString(custom.type, encryptionKey),
                });
            }
            return result;
        },
        encryptPasswordAttachment: (buffer, passwordEncryptionKey) => {
            let arrayBuffer = new Int8Array(buffer);
            if (arrayBuffer.byteLength > 1024 * 100) {
                throw "Attached file max size is 100KB";
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
        formatAttachments: (attachments, encryptionKey, fileManager) => {
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
    }

    return self;
};
