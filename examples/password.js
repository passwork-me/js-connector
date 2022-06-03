async function passwordExamples (passwork, env)  {
    let password;
    password = await passwork.getPassword(env.EXAMPLE_PASSWORD);
    console.log(password);
    console.log('Decrypted password: ', password.getPassword());
    console.log('Decrypted customs: ', password.getCustoms());

    let recent = await passwork.getRecentPasswords();
    console.log('Recent: ', recent);

    let favoriteList = await passwork.getFavoritePasswords();
    console.log('Favorite: ', favoriteList);

    let searchResult = await passwork.searchPasswords('pass');
    console.log('Search results: ', searchResult);

    password = await passwork.addPassword({
        vaultId: env.EXAMPLE_VAULT,
        name: 'Pass Name',
        login: 'PassLogin',
        password: 'password',
        folderId:    null,
        tags:        [],
        snapshot:    null,
        color:       '3',
        custom:      [
            {
                name:  'Additional login 1',
                value: 'PassLogin1',
                type:  'text'
            },
            {
                name:  'Additional password 1',
                value: 'password1',
                type:  'password'
            },
        ],
        attachments: [
            {
                path: './example-attachment.png',
                name: 'attachment.png'
            }
        ],
    });
    console.log('Added password: ', password);

    password = await passwork.editPassword(password.id, {
        name:     'Edited Pass Name',
        login:    'Edited Pass Login',
        password: 'password2',
    });
    console.log('Edited password: ', password);

    try {
        let addAttachment = await passwork.addPasswordAttachment(password.id, './example-attachment.png');
        console.log(addAttachment);

        let attachmentId = (await passwork.getPassword(password.id)).attachments[0].id;
        let attachment = await passwork.getAttachment(password.id, attachmentId)
        attachment.saveTo('./', 'downloaded-attachment.png');

        let delAttachment = await passwork.deletePasswordAttachment(password.id, attachmentId);
        console.log(delAttachment);
    } catch (e) {
        console.log(e);
    }

    let copiedId = await passwork.copyPassword(password.id, env.EXAMPLE_VAULT);
    console.log(copiedId);

    let movedId = await passwork.movePassword(copiedId, env.EXAMPLE_VAULT, env.EXAMPLE_FOLDER);
    console.log(movedId);

    let favorite = await passwork.favoritePassword(password.id);
    console.log(favorite);

    let unfavorite = await passwork.unfavoritePassword(password.id);
    console.log(unfavorite);

    let sharingInfo = await passwork.getPasswordSharingInfo(password.id);
    console.log('Password sharing info: ', sharingInfo);

    let sharedLink = await passwork.generatePasswordShareLink(password.id);
    console.log('Password shared link: ', sharedLink);

    let delPwd = await passwork.deletePassword(password.id);
    let delCopy = await passwork.deletePassword(movedId);
    console.log(delPwd, delCopy);


    let inboxPasswordsList = await passwork.getInboxPasswords();
    console.log('Inbox passwords list: ', inboxPasswordsList);

    if (inboxPasswordsList.length) {
        let inboxPassword = await passwork.getInboxPassword(inboxPasswordsList[0].id);
        console.log('Inbox password: ', inboxPassword);
    }
}

if (typeof module !== 'undefined') {
    module.exports = {passwordExamples};
}
