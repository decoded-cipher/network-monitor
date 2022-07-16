require('dotenv').config()

var helper = require('./helper');

(async () => {
    setInterval(async () => {
        await helper.pingHosts().then((hosts) => {
            console.table(hosts);
        }).catch((err) => {
            console.log(err);
        });
    }, 5000);
})();