module.exports = options => {
    const cryptoInterface = require("./crypt")(options);

    let self = {
        encryptSessionCode:        ({token, tokenTtl, tokenExpiredAt, masterPassword, legacySupport}) => {
            return cryptoInterface.base64encode(
                JSON.stringify({token, tokenTtl, tokenExpiredAt, masterPassword, legacySupport})
            );
        },
        decryptSessionCode:        (sessionCode) => {
            return JSON.parse(cryptoInterface.base64decode(sessionCode));
        },
        getVaultMaster:            (vault) => {
            if (!options.useMasterPassword) {
                return '';
            }
            if (vault.scope === 'domain') {
                let domainMaster = cryptoInterface.decode(vault.domainMaster, options.masterPassword);
                return cryptoInterface.decode(vault.passwordCrypted, domainMaster);
            } else {
                return cryptoInterface.decode(vault.passwordCrypted, options.masterPassword);
            }
        },
        encryptString:             (password, vault, masterPassword = null) => {
            if (options.useMasterPassword) {
                masterPassword = masterPassword || self.getVaultMaster(vault);
                return cryptoInterface.encode(password, masterPassword);
            } else {
                return cryptoInterface.base64encode(password)
            }
        },
        decryptString:             (password, vault, masterPassword = null) => {
            if (options.useMasterPassword) {
                masterPassword = masterPassword || self.getVaultMaster(vault);
                return cryptoInterface.decode(password, masterPassword);
            } else {
                return cryptoInterface.base64decode(password);
            }
        },
        encryptCustoms:            (customFields, vault, masterPassword = null) => {
            masterPassword = masterPassword || self.getVaultMaster(vault);
            return customFields.map(custom => {
                for (const field in custom) {
                    if (field !== 'name' && field !== 'value' && field !== 'type') {
                        return;
                    }
                    custom[field] = self.encryptString(custom[field], vault, masterPassword);
                }
                return custom;
            });
        },
        decryptCustoms:            (customFields, vault, masterPassword = null) => {
            masterPassword = masterPassword || self.getVaultMaster(vault);
            let result = [];
            for (const custom of customFields) {
                result.push({
                    name:  self.decryptString(custom.name, vault, masterPassword),
                    value: self.decryptString(custom.value, vault, masterPassword),
                    type:  self.decryptString(custom.type, vault, masterPassword),
                });
            }
            return result;
        },
        encryptPasswordAttachment: (buffer, vault, masterPassword = null) => {
            let arrayBuffer = new Int8Array(buffer);
            if (arrayBuffer.byteLength > 1024 * 100) {
                throw "Attached file max size is 100KB";
            }
            let key, encryptedKey, encryptedData;
            if (options.useMasterPassword) {
                masterPassword = masterPassword || self.getVaultMaster(vault);
                key = cryptoInterface.generateString(32);
                encryptedKey = cryptoInterface.encode(key, masterPassword);
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
        decryptPasswordAttachment: (attachment, vault, masterPassword = null) => {
            masterPassword = masterPassword || self.getVaultMaster(vault);
            let key = cryptoInterface.decode(attachment.encryptedKey, masterPassword);
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
        formatAttachments:         (attachments, vault, fileManager) => {
            const result = [];
            for (let {path, name} of attachments) {
                if (!path) {
                    continue;
                }
                try {
                    let data = self.encryptPasswordAttachment(fileManager.readFile(path), vault);
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
