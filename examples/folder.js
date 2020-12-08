const env = require('dotenv').config().parsed;

module.exports = {
    examples: async (passwork) => {
        let folder = await passwork.getFolder(env.EXAMPLE_FOLDER);
        console.log(folder);

        folders = await passwork.getFolders(env.EXAMPLE_VAULT);
        console.log('Vault Folders: ', folders);

        folders = await passwork.getSubFolders(env.EXAMPLE_FOLDER);
        console.log('Sub Folders: ', folders);

        let foldersSearchResult = await passwork.searchFolders('fold');
        console.log('Search results: ', foldersSearchResult);

        folder = await passwork.addFolder(env.EXAMPLE_VAULT, 'New Folder');
        console.log('Created Folder :', folder);

        let editedFolder = await passwork.editFolder(folder.id, 'Edited Folder', null);
        console.log('Edited Folder: ', editedFolder);

        let deletedFolder = await passwork.deleteFolder(folder.id)
        console.log(deletedFolder);
    }
}
