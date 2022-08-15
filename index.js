require('dotenv').config()

var helper = require('./helper');
var db = require('./config.js');

(async () => {
    setInterval(async () => {
        await helper.checkForChangeInStatus().then((hosts) => {
            console.table(hosts);
        }).catch((err) => {
            console.log(err);
        });
    }, process.env.FREQUENCY);

    helper.CronJobToSendEmailAtMidnight();
})();



db.connect((err) => {
    if (err) {
      console.log('Connection Error : ' + err)
    } else {
    console.log('Database Connected to PORT 27017')
    }
  })