/**
 * Passwork API
 * @interface
 */
function PassworkAPI() {
}

/**
 * Login
 * @see POST: /auth/login/{apiKey}
 * @param {string} apiKey
 * @param {string|null} masterPassword
 * @return {Promise}
 */
PassworkAPI.prototype.login = (apiKey, masterPassword = null) => throw new Error('not implemented');

/**
 * Set apiToken and masterPassword directly without Login method call
 * @param {string} apiToken
 * @param {string|boolean} masterPassword
 */
PassworkAPI.prototype.setAuthOptions = (apiToken, masterPassword = false) => {};

/**
 * Set request options
 * @param {{
 *   lang: string,
 *   hash: string,
 * }} options */
PassworkAPI.prototype.setOptions = (options) => {};

/**
 * Logout
 * @see POST: /auth/logout
 * @return {Promise}
 */
PassworkAPI.prototype.logout = () => throw new Error('not implemented');

/**
 * Get passwork version
 * @see GET: /info/version
 * @return {Promise}
 */
PassworkAPI.prototype.version = () => throw new Error('not implemented');

/**
 * User info
 * @see GET: /user/info
 * @return {Promise}
 */
PassworkAPI.prototype.userInfo = () => throw new Error('not implemented');

/**
 * Get last user notifications
 * @see POST: /user/notifications
 * @param {number} page
 * @param {number} limit
 * @return {Promise}
 */
PassworkAPI.prototype.userNotifications = (page = 1, limit = 10) => throw new Error('not implemented');

/**
 * Get number of not viewed notifications
 * @see GET: /user/notifications/count-new
 * @return {Promise}
 */
PassworkAPI.prototype.userNotificationsCountNew = () => throw new Error('not implemented');

/**
 * Mark all user notifications as viewed
 * @see POST: /user/notifications/mark-as-viewed
 * @return {Promise}
 */
PassworkAPI.prototype.userNotificationsMarkAsViewed = () => throw new Error('not implemented');

/**
 * Get passwords
 * @see GET: /vaults/{id}/passwords
 * @see GET: /folders/{id}/passwords
 * @param {string|null} vaultId
 * @param {string|null} folderId
 * @return {Promise}
 */
PassworkAPI.prototype.getPasswords = (vaultId = null, folderId = null) => throw new Error('not implemented');

/**
 * Get recently viewed passwords
 * @see GET: /passwords/recent
 * @return {Promise}
 */
PassworkAPI.prototype.getRecentPasswords = () => throw new Error('not implemented');

/**
 * Get favorite passwords
 * @see GET: /passwords/favorite
 * @return {Promise}
 */
PassworkAPI.prototype.getFavoritePasswords = () => throw new Error('not implemented');

/**
 * Get password by ID
 * @see GET: /passwords/{id}
 * @param {string} passwordId — ID
 * @return {Promise}
 */
PassworkAPI.prototype.getPassword = (passwordId) => throw new Error('not implemented');

/**
 * Get password attachment
 * @see GET: /passwords/{id}/attachment/{attachmentId}
 * @param {string} passwordId — ID
 * @param attachmentId
 * @return {Promise}
 */
PassworkAPI.prototype.getAttachment = (passwordId, attachmentId) => throw new Error('not implemented');

/**
 * Search passwords
 * @see POST: /passwords/search
 * @param {string} query
 * @param {string[]} tags
 * @param {string[]} colors
 * @param {string|null} vaultId
 * @param {boolean} includeShared
 * @return {Promise}
 */
PassworkAPI.prototype.searchPasswords = (query, tags = [], colors = [], vaultId = null, includeShared = false) =>
    throw new Error('not implemented');

/**
 * Search passwords by URL
 * @see POST: /passwords/searchByUrl
 * @param {string} url
 * @param {boolean} includeShared
 * @return {Promise}
 */
PassworkAPI.prototype.searchPasswordsByUrl = (url, includeShared = false) => throw new Error('not implemented');

/**
 * Add password
 * @see POST: /passwords
 * @param {{
 *   vaultId:  string
 *   name:     string,
 *   login:    string,
 *   password: string,
 *   color:    string|null,
 *   folderId: string|null,
 *   tags:     string[],
 *   custom: [
 *      {
 *          name:  string,
 *          value: string,
 *          type:  string
 *      }
 *   ],
 *   attachments: [
 *       {
 *           path: string,
 *           name: string|null
 *       }
 *   ]
 * }} fields
 * @return {Promise}
 */
PassworkAPI.prototype.addPassword = (fields = {}) => throw new Error('not implemented');

/**
 * Edit password
 * @see PUT: /passwords/{id}
 * @param {string} passwordId
 * @param {{
 *   name: string|null,
 *   login: string|null,
 *   password: string|null,
 *   color: string|null,
 *   tags: string[],
 *   custom: [
 *      {
 *          name:  string,
 *          value: string,
 *          type:  string
 *      }
 *   ],
 *   attachments: [
 *       {
 *           path: string,
 *           name: string|null
 *       }
 *   ]
 * }} fields
 * @return {Promise}
 */
PassworkAPI.prototype.editPassword = (passwordId, fields = {}) => throw new Error('not implemented');

/**
 * Delete password
 * @see DELETE: /passwords/{id}
 * @param {string} passwordId
 * @return {Promise}
 */
PassworkAPI.prototype.deletePassword = (passwordId) => throw new Error('not implemented');

/**
 * Move password
 * @see POST: /passwords/{id}/move
 * @param {string} passwordId
 * @param {string} vaultIdTo
 * @param {string|null} folderIdTo
 * @return {Promise}
 */
PassworkAPI.prototype.movePassword = (passwordId, vaultIdTo, folderIdTo = null) => throw new Error('not implemented');

/**
 * Copy password
 * @see POST: /passwords/{id}/copy
 * @param {string} passwordId
 * @param {string} vaultIdTo
 * @param {string|null} folderIdTo
 * @return {Promise}
 */
PassworkAPI.prototype.copyPassword = (passwordId, vaultIdTo, folderIdTo = null) => throw new Error('not implemented');

/**
 * Attach file to password
 * @see POST: /passwords/{id}/attachment
 * @param {string}passwordId
 * @param {string}attachmentPath
 * @param {string|null}attachmentName
 * @return {Promise}
 */
PassworkAPI.prototype.addPasswordAttachment = (passwordId, attachmentPath, attachmentName = null) =>
    throw new Error('not implemented');

/**
 * Delete password attachment
 * @see DELETE: /passwords/{id}/attachment/{attachmentId}
 * @param {string}passwordId
 * @param {string}attachmentId
 * @return {Promise}
 */
PassworkAPI.prototype.deletePasswordAttachment = (passwordId, attachmentId) => throw new Error('not implemented');

/**
 * Mark password as favorite
 * @see POST: /passwords/{id}/favorite
 * @param {string}passwordId
 * @return {Promise}
 */
PassworkAPI.prototype.favoritePassword = (passwordId) => throw new Error('not implemented');

/**
 * Unfavorite password
 * @see POST: /passwords/{id}/unfavorite
 * @param {string}passwordId
 * @return {Promise}
 */
PassworkAPI.prototype.unfavoritePassword = (passwordId) => throw new Error('not implemented');

/**
 * Get password sharing info
 * @see GET: /passwords/{id}/sharingInfo
 * @param {string} passwordId — ID
 * @return {Promise}
 */
PassworkAPI.prototype.getPasswordSharingInfo = (passwordId) => throw new Error('not implemented');

/**
 * Generate share hyperlink
 * @see POST: /passwords/generate-share-link
 * @param {string} passwordId
 * @param {boolean} reusable
 * @param {number} time — Time to live in hours
 * @param {string|null} secret
 * @return {Promise}
 */
PassworkAPI.prototype.generatePasswordShareLink = (passwordId, reusable = false, time = 24, secret = null) => throw new Error('not implemented');

/**
 * Get inbox passwords list
 * @see GET: /sharing/inbox/list
 * @return {Promise}
 */
PassworkAPI.prototype.getInboxPasswords = () => throw new Error('not implemented');

/**
 * Get inbox password
 * @see GET: /sharing/inbox/{inboxId}
 * @param {string} inboxId
 * @return {Promise}
 */
PassworkAPI.prototype.getInboxPassword = (inboxId) => throw new Error('not implemented');

/**
 * Get vaults of current user
 * @see GET: /vaults/list
 * @return {Promise}
 */
PassworkAPI.prototype.getVaults = () => throw new Error('not implemented');

/**
 * Get vault by id
 * @see GET: /vaults/{id}
 * @param {string} vaultId — ID
 * @return {Promise}
 */
PassworkAPI.prototype.getVault = (vaultId) => throw new Error('not implemented');

/**
 * Get vault passwords and folder
 * @see GET: /vaults/{id}/fullInfo
 * @param {string} vaultId — ID
 * @return {Promise}
 */
PassworkAPI.prototype.getVaultFullInfo = (vaultId) => throw new Error('not implemented');

/**
 * Get vault sharing info for vault admin
 * @see GET: /vaults/{id}/sharingInfo
 * @param {string} vaultId — ID
 * @return {Promise}
 */
PassworkAPI.prototype.getVaultSharingInfo = (vaultId) => throw new Error('not implemented');

/**
 * Get vault folders
 * @see GET: /vaults/{id}/folders
 * @param {string} vaultId — ID
 * @return {Promise}
 */
PassworkAPI.prototype.getVaultFolders = (vaultId) => throw new Error('not implemented');

/**
 * Get all tags
 * @see GET: /vaults/tags
 * @return {Promise}
 */
PassworkAPI.prototype.getTags = () => throw new Error('not implemented');

/**
 * Get all color tags
 * @see GET: /vaults/colors
 * @return {Promise}
 */
PassworkAPI.prototype.getColors = () => throw new Error('not implemented');

/**
 * Get vault tags
 * @see GET: /vaults/{id}/tags
 * @param {string} vaultId — ID
 * @return {Promise}
 */
PassworkAPI.prototype.getVaultTags = (vaultId) => throw new Error('not implemented');

/**
 * Get vault colors
 * @see GET: /vaults/{id}/colors
 * @param {string} vaultId — ID
 * @return {Promise}
 */
PassworkAPI.prototype.getVaultColors = (vaultId) => throw new Error('not implemented');

/**
 * Add vault
 * @see POST: /vaults
 * @param {string} vaultName
 * @param {boolean} isPrivate
 * @return {Promise}
 */
PassworkAPI.prototype.addVault = (vaultName, isPrivate = false) => throw new Error('not implemented');

/**
 * Edit vault
 * @see PUT: /vaults/{id}
 * @param {string} vaultId
 * @param {string} vaultName
 * @return {Promise}
 */
PassworkAPI.prototype.editVault = (vaultId, vaultName) => throw new Error('not implemented');

/**
 * Delete vault by id
 * @see DELETE: /vaults/{id}
 * @param {string} vaultId — ID
 * @return {Promise}
 */
PassworkAPI.prototype.deleteVault = (vaultId) => throw new Error('not implemented');

/**
 * Get folder by id
 * @see GET: /folders/{id}
 * @param {string} folderId
 * @return {Promise}
 */
PassworkAPI.prototype.getFolder = (folderId) => throw new Error('not implemented');

/**
 * Get folders from vault's root
 * @see GET: /vaults/{id}/folders
 * @param {string} vaultId — ID
 * @return {Promise}
 */
PassworkAPI.prototype.getFolders = (vaultId) => throw new Error('not implemented');

/**
 * Get subfolders
 * @see GET: /folders/{id}/children
 * @param {string} folderId — ID
 * @return {Promise}
 */
PassworkAPI.prototype.getSubFolders = (folderId) => throw new Error('not implemented');

/**
 * Search folders
 * @see POST: /folders/search
 * @param {string} query
 * @return {Promise}
 */
PassworkAPI.prototype.searchFolders = (query) => throw new Error('not implemented');

/**
 * Create folder in vault
 * @see POST: /folders
 * @param {string} vaultId
 * @param {string} folderName
 * @param {string|null} parentFolderId
 * @return {Promise}
 */
PassworkAPI.prototype.addFolder = (vaultId, folderName, parentFolderId = null) => throw new Error('not implemented');

/**
 * Edit folder
 * @see PUT: /folders/{id}
 * @param {string} folderId
 * @param {string} folderName
 * @param {string} parentFolderId
 * @return {Promise}
 */
PassworkAPI.prototype.editFolder = (folderId, folderName, parentFolderId) => throw new Error('not implemented');

/**
 * Delete folder
 * @see DELETE: /folders/{id}
 * @param folderId
 * @return {Promise}
 */
PassworkAPI.prototype.deleteFolder = (folderId) => throw new Error('not implemented');

/**
 * Move folder with passwords
 * @see POST: /folders/{id}/move
 * @param {string} folderId
 * @param {string} vaultTo
 * @param {string|null} folderTo
 * @return {Promise}
 */
PassworkAPI.prototype.moveFolder = (folderId, vaultTo, folderTo = null) => throw new Error('not implemented');

/**
 * Copy folder with passwords
 * @see POST: /folders/{id}/copy
 * @param {string} folderId
 * @param {string} vaultTo
 * @param {string|null} folderTo
 * @return {Promise}
 */
PassworkAPI.prototype.copyFolder = (folderId, vaultTo, folderTo = null) => throw new Error('not implemented');

/**
 * Get activity report for selected period
 * @see POST: /info/activity-report
 * @param {string} dateFrom - 2020-12-01
 * @param {string|null} dateTo - 2020-12-31
 * @return {Promise}
 */
PassworkAPI.prototype.activityReport = (dateFrom, dateTo = null) => throw new Error('not implemented');

/**
 * Get passwork settings
 * @see GET: /info/settings
 * @return {Promise}
 */
PassworkAPI.prototype.getPassworkSettings = () => throw new Error('not implemented');
