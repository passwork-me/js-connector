const cryptoInterface = require("./crypt");
const fs = typeof module !== 'undefined' ? require("fs") : require('./fs-web');
const pathMod = require('path');

module.exports = options => {
    let self = {
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
        encryptString:             (password, vault, vaultMaster = null) => {
            if (options.useMasterPassword) {
                vaultMaster = vaultMaster || self.getVaultMaster(vault);
                return cryptoInterface.encode(password, vaultMaster);
            } else {
                return cryptoInterface.base64encode(password)
            }
        },
        decryptString:             (password, vault, vaultMaster = null) => {
            if (options.useMasterPassword) {
                vaultMaster = vaultMaster || self.getVaultMaster(vault);
                return cryptoInterface.decode(password, vaultMaster);
            } else {
                return cryptoInterface.base64decode(password);
            }
        },
        encryptCustoms:            (customFields, vault) => {
            let vaultMaster = self.getVaultMaster(vault);
            return customFields.map(custom => {
                for (const field in custom) {
                    if (field !== 'name' && field !== 'value' && field !== 'type') {
                        return;
                    }
                    custom[field] = self.encryptString(custom[field], vault, vaultMaster);
                }
                return custom;
            });
        },
        decryptCustoms:            (customFields, vault) => {
            let vaultMaster = self.getVaultMaster(vault);
            let result = [];
            for (const custom of customFields) {
                result.push({
                    name:  self.decryptString(custom.name, vault, vaultMaster),
                    value: self.decryptString(custom.value, vault, vaultMaster),
                    type:  self.decryptString(custom.type, vault, vaultMaster),
                });
            }
            return result;
        },
        encryptPasswordAttachment: (buffer, vault) => {
            let arrayBuffer = new Int8Array(buffer);
            if (arrayBuffer.byteLength > 1024 * 100) {
                throw "Attached file max size is 100KB";
            }
            let key, encryptedKey, encryptedData;
            if (options.useMasterPassword) {
                key = cryptoInterface.generateString(32);
                encryptedKey = cryptoInterface.encode(key, self.getVaultMaster(vault));
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
        decryptPasswordAttachment: (attachment, vault) => {
            let vaultMaster = self.getVaultMaster(vault);
            let key = cryptoInterface.decode(attachment.encryptedKey, vaultMaster);
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
        formatAttachments:         (attachments, vault) => {
            const result = [];
            for (let {path, name} of attachments) {
                if (!path) {
                    continue;
                }
                try {
                    let data = self.encryptPasswordAttachment(fs.readFileSync(path), vault);
                    data.name = !name ? pathMod.basename(path) : name;
                    result.push(data);
                } catch (e) {
                }
            }
            return result;
        },
    }

    return self;
};
