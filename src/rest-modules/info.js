module.exports = function (options, request, api) {
    api.activityReport = (dateFrom, dateTo = null) => request.post("/info/activity-report", {dateFrom, dateTo});
    api.version = () => request.get("/info/version");
};
