const fs = require('fs');
const pathModule = require('path');

module.exports = {
    canUseFs:        true,
    readFile:        path => {
        return fs.readFileSync(path)
    },
    getFileBasename: path => {
        return pathModule.basename(path);
    },
    saveToFile:      (path, data) => {
        fs.writeFileSync(path, data)
    },

};
