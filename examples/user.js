async function userExamples(passwork) {
    let notifications = await passwork.userNotifications();
    console.log('User notifications: ', notifications);

    let newNotifications = await passwork.userNotificationsCountNew();
    console.log('New notifications count: ', newNotifications);

    let markAsViewed = await passwork.userNotificationsMarkAsViewed();
    console.log(markAsViewed);
}

if (typeof module !== 'undefined') {
    module.exports = {userExamples};
}
