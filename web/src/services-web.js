module.exports = {
    agent:       require('../../src/passwork-agent'),
    fileManager: {
        canUseFs:        false,
        readFile:        path => {
            throw 'Not implemented for web version'
        },
        getFileBasename: path => {
            throw 'Not implemented for web version'
        },
        saveToFile:      (path, data) => {
            throw 'Not implemented for web version'
        },
    }
};
