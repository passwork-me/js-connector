const ftp = require('basic-ftp');

module.exports = {
    examples: async (passwork) => {
        // Create vault and password
        let vaultId = await passwork.addVault('API Vault', false);
        let {id: passwordId} = await passwork.addPassword({
            vaultId,
            name: 'FTP Access',
            login: 'dlpuser@dlptest.com',
            password: 'eUj8GeW55SvYaswqUyDSm5v6N',
            url: 'ftp.dlptest.com'
        });

        // Get password with auth data
        let {url, login, getPassword: pwd} = await passwork.getPassword(passwordId);

        // Try login to ftp server and get list of files
        const client = new ftp.Client()
        try {
            await client.access({
                host:     url,
                user:     login,
                password: pwd()
            })
            console.log(await client.list())
        } catch (err) {
            console.log(err)
        }
        client.close()

        // Remove created password and vault
        await passwork.deletePassword(passwordId)
        await passwork.deleteVault(vaultId);
    }
}
