const env = require('dotenv').config().parsed;

module.exports = {
    examples: async (passwork) => {
        let vaults = await passwork.getVaults();
        console.log('Vaults: ', vaults);

        let vault = await passwork.getVault(env.EXAMPLE_VAULT);
        console.log('Vault: ', vault);

        let folders = await passwork.getVaultFolders(env.EXAMPLE_VAULT);
        console.log('Vault Folders: ', folders);

        let passwords = await passwork.getPasswords(env.EXAMPLE_VAULT);
        console.log('Vault Passwords: ', passwords);

        let fullInfo = await passwork.getVaultFullInfo(env.EXAMPLE_VAULT);
        console.log('Vault Full Info: ', fullInfo);

        let tags = await passwork.getTags()
        console.log('All Tags: ', tags);

        let colors = await passwork.getColors();
        console.log('All Colors: ', colors);

        let vaultTags = await passwork.getVaultTags(env.EXAMPLE_VAULT)
        console.log('Vault Tags: ', vaultTags);

        let vaultColors = await passwork.getVaultColors(env.EXAMPLE_VAULT);
        console.log('Vault Colors: ', vaultColors);

        let newVaultId = await passwork.addVault('New API Vault', false);
        console.log('Created Vault: ', newVaultId);

        let editedVault = await passwork.editVault(newVaultId, 'Edited API Vault')
        console.log('Edited Vault: ', editedVault);

        let deletedVault = await passwork.deleteVault(newVaultId);
        console.log(deletedVault);
    }
}
