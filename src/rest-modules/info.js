module.exports = function (options, request, api) {
    api.activityReport = (dateFrom, dateTo = null) => request.post("/info/activity-report", {dateFrom, dateTo});

    api.version = async () => {
        const version = await request.get("/info/version");
        const versionInfo = {
            version:       '',
            legacySupport: false,
        };
        if (!version) {
            return versionInfo;
        }
        if (typeof version === 'string') {
            versionInfo.version = version;
            return versionInfo;
        }

        for (const prop in versionInfo) {
            if (version.hasOwnProperty(prop)) {
                versionInfo[prop] = version[prop];
            }
        }
        return versionInfo;
    };

    api.getPassworkSettings = () => request.get("/info/settings");
};
