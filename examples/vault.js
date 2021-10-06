async function vaultExamples(passwork, {EXAMPLE_VAULT: exampleVault}) {
    let vaults = await passwork.getVaults();
    console.log('Vaults: ', vaults);

    let vault = await passwork.getVault(exampleVault);
    console.log('Vault: ', vault);

    let folders = await passwork.getVaultFolders(exampleVault);
    console.log('Vault Folders: ', folders);

    let passwords = await passwork.getPasswords(exampleVault);
    console.log('Vault Passwords: ', passwords);

    let fullInfo = await passwork.getVaultFullInfo(exampleVault);
    console.log('Vault Full Info: ', fullInfo);

    let sharingInfo = await passwork.getVaultSharingInfo(exampleVault);
    console.log('Vault Sharing Info: ', sharingInfo);

    let tags = await passwork.getTags()
    console.log('All Tags: ', tags);

    let colors = await passwork.getColors();
    console.log('All Colors: ', colors);

    let vaultTags = await passwork.getVaultTags(exampleVault)
    console.log('Vault Tags: ', vaultTags);

    let vaultColors = await passwork.getVaultColors(exampleVault);
    console.log('Vault Colors: ', vaultColors);

    let newVaultId = await passwork.addVault('New API Vault', false);
    console.log('Created Vault: ', newVaultId);

    let editedVault = await passwork.editVault(newVaultId, 'Edited API Vault')
    console.log('Edited Vault: ', editedVault);

    let deletedVault = await passwork.deleteVault(newVaultId);
    console.log(deletedVault);
}

if (typeof module !== 'undefined') {
    module.exports = {vaultExamples};
}
