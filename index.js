require('dotenv').config()

var helper = require('./helper');

var frequency = 1000 * 60; // 1 minute

(async () => {
    setInterval(async () => {
        await helper.checkForChangeInStatus().then((hosts) => {
            console.table(hosts);
        }).catch((err) => {
            console.log(err);
        });
    }, 5000);
})();