require('dotenv').config()

var helper = require('./helper');

(async () => {
    setInterval(async () => {
        await helper.checkForChangeInStatus().then((hosts) => {
            console.table(hosts);
        }).catch((err) => {
            console.log(err);
        });
    }, process.env.FREQUENCY);
})();