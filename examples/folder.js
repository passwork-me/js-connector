async function folderExamples(passwork, {EXAMPLE_VAULT: exampleVault, EXAMPLE_FOLDER: exampleFolder}) {
    let folder = await passwork.getFolder(exampleFolder);
    console.log(folder);

    folders = await passwork.getFolders(exampleVault);
    console.log('Vault Folders: ', folders);

    folders = await passwork.getSubFolders(exampleFolder);
    console.log('Sub Folders: ', folders);

    let foldersSearchResult = await passwork.searchFolders('fold');
    console.log('Search results: ', foldersSearchResult);

    folder = await passwork.addFolder(exampleVault, 'New Folder');
    console.log('Created Folder :', folder);

    let editedFolder = await passwork.editFolder(folder.id, 'Edited Folder', null);
    console.log('Edited Folder: ', editedFolder);

    let deletedFolder = await passwork.deleteFolder(folder.id)
    console.log(deletedFolder);
}

if (typeof module !== 'undefined') {
    module.exports = {folderExamples};
}
