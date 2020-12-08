const env = require('dotenv').config().parsed;

module.exports = {
    examples: async (passwork) => {
        let password;
        password = await passwork.getPassword(env.EXAMPLE_PASSWORD);
        console.log(password);
        console.log('Decrypted password: ', password.getPassword());
        console.log('Decrypted customs: ', password.getCustoms());

        let recent = await passwork.getRecentPasswords();
        console.log('Recent: ', recent);

        let searchResult = await passwork.searchPasswords('pass');
        console.log('Search results: ', searchResult);

        password = await passwork.addPassword(env.EXAMPLE_VAULT, 'Pass Name', 'PassLogin', 'password', {
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

        let addAttachment = await passwork.addPasswordAttachment(password.id, './example-attachment.png');
        console.log(addAttachment);

        let attachmentId = (await passwork.getPassword(password.id)).attachments[0].id;
        let attachment = await passwork.getAttachment(password.id, attachmentId)
        attachment.saveTo('./', 'downloaded-attachment.png');

        let delAttachment = await passwork.deletePasswordAttachment(password.id, attachmentId);
        console.log(delAttachment);

        let copiedId = await passwork.copyPassword(password.id, env.EXAMPLE_VAULT);
        console.log(copiedId);

        let movedId = await passwork.movePassword(copiedId, env.EXAMPLE_VAULT, env.EXAMPLE_FOLDER);
        console.log(movedId);

        let delPwd = await passwork.deletePassword(password.id);
        let delCopy = await passwork.deletePassword(movedId);
        console.log(delPwd, delCopy);
    }
}
