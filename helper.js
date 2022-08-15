const ping = require('ping');
var nodemailer = require('nodemailer');
var handlebars = require('handlebars');

var db = require('./config.js');

const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, './templates/notify-email.hbs');
const source = fs.readFileSync(filePath, 'utf-8').toString();

var CronJob = require('cron').CronJob;

var Hosts = [
    {
        date: '',
        time: '',
        name: process.env.HOSTNAME_01,
        ip: process.env.HOSTIP_01,
        status: ''
    },
    {
        date: '',
        time: '',
        name: process.env.HOSTNAME_02,
        ip: process.env.HOSTIP_02,
        status: ''
    }
];

var Prev_Status = [
    {
        name: process.env.HOSTNAME_01,
        status: ''
    },
    {
        name: process.env.HOSTNAME_02,
        status: ''
    }
];

module.exports = {
    
    pingHosts: () => {
        return new Promise((resolve, reject) => {
            Hosts.forEach(async (host) => {
                var today = new Date();
                
                host.date = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
                host.time = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;
                
                ping.sys.probe(host.ip, (active) => {
                    active ? host.status = 'Active' : host.status = 'Inactive';
                });

                await module.exports.calculateDownTime(host);
            });
            resolve(Hosts);
        })
    },

    checkForChangeInStatus: () => {
        return new Promise((resolve, reject) => {
            module.exports.pingHosts().then(async (hosts) => {
                
                
                for (var i = 0; i < Prev_Status.length; i++) {
                    
                    if (Prev_Status[i].status !== hosts[i].status) {
                        if (Prev_Status[i].status !== '') {
                            console.log("Change in status detected for host: " + hosts[i].name);
                            console.log("Previous status: " + Prev_Status[i].status);
                            console.log("New status: " + hosts[i].status);
                            console.log("\n");
                            
                            // await module.exports.saveHostsOntoTextFile(hosts);

                            await module.exports.curateEmailMessage(hosts[i]).then((message) => {
                                
                                console.log(message);
                                // module.exports.sendEmail(hosts, message);
                                console.log("Completed sending email...");

                            }).catch((err) => {
                                console.log(err);
                            });
                            
                            await module.exports.processDataForDB(hosts);
                            console.log("After processing data...");
                        }
                        Prev_Status[i].status = hosts[i].status;
                    }

                }
                resolve(hosts);
            }).catch((err) => {
                console.log(err);
            });
        })
    },

    sendEmail: (hosts, message) => {
        return new Promise((resolve, reject) => {
            
            const template = handlebars.compile(source);
            var replacements = {
                hosts: hosts,
                message: message
            };
            const htmlToSend = template(replacements);
            
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
            
            var emailAddress = process.env.EMAIL_TO.split(',');
            
            emailAddress.forEach(email => {
                console.log("Sending email to " + email);
                
                var mailOptions = {
                    from: `"Mail Notify" <${process.env.EMAIL_USER}>`,
                    to: email,
                    subject: 'Alert: Gateway Status Changed!',
                    // text: emailMessage,
                    html: htmlToSend,
                    headers: { 'x-myheader': 'test header' }
                };
                
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                    }
                });
            });

            resolve();
        })
    },

    curateEmailMessage: (item) => {
        return new Promise((resolve, reject) => {
            var emailMessage = '';
            if (item.status === 'Inactive') {
                emailMessage = `Gateway '${item.name}' is Down.`;
            } else {
                emailMessage = `Gateway '${item.name}' is Up.`;
            }
            resolve(emailMessage);
        })
    },

    saveHostsOntoTextFile: (hosts) => {
        return new Promise((resolve, reject) => {
            var text = '';
            hosts.forEach((host) => {
                text += `${host.date}   ${host.time}    -    ${host.ip}  -   ${host.status}  (${host.name})\n`;
            });
            text += '\n';
            fs.appendFile('./logs.txt', text, (err) => {
                if (err) throw err;
                console.log('Hosts saved to file!');
            });
            resolve();
        })
    },

    calculateDownTime: (host) => {
        return new Promise((resolve, reject) => {

            
            if (host.downtime === undefined) {
                db.get().collection(process.env.DB_COLLECTION).findOne({ date: host.date }, (err, result) => {
                    if (err) throw err;
                    if (result === null) {
                        host.downtime = 0;
                    }
                    else {
                        result.hosts.forEach((item) => {
                            if (item.name === host.name) {
                                host.downtime = item.downtime;
                            }
                        });
                    }
                });
            }

            if (host.status === 'Inactive') {
                host.downtime = host.downtime + (parseInt(process.env.FREQUENCY)/1000);
            }
            resolve();
        })
    },

    updateOnDB: (data) => {
        return new Promise((resolve, reject) => {

            db.get().collection(process.env.DB_COLLECTION).findOne({ date: data.date }, async (err, result) => {
                if (err) throw err;
                if (result === null) {

                    await db.get().collection(process.env.DB_COLLECTION).insertOne(data, (err, res) => {
                        if (err) throw err;
                        console.log('Data saved to MongoDB!');
                    });

                } else {

                    await db.get().collection(process.env.DB_COLLECTION).updateOne({ date: data.date }, { $set: data }, (err, res) => {
                        if (err) throw err;
                        console.log('Data updated in MongoDB!');
                    });

                }
            });
            resolve();
        })
    },

    processDataForDB: (hosts) => {
        return new Promise((resolve, reject) => {
            var data = {
                date: hosts[0].date,
                hosts: [
                    {
                        name: hosts[0].name,
                        ip: hosts[0].ip,
                        downtime: hosts[0].downtime
                    },
                    {
                        name: hosts[1].name,
                        ip: hosts[1].ip,
                        downtime: hosts[1].downtime
                    }
                ]
            };
            module.exports.updateOnDB(data).then(() => {
                resolve();
            }).catch((err) => {
                console.log(err);
            })
        })
    },

    CronJobToSendEmailAtMidnight: () => {
        return new Promise((resolve, reject) => {
            var job = new CronJob('00 00 00 * * *', async() => {

                await module.exports.processDataForDB(Hosts);
                Hosts[0].downtime = Hosts[1].downtime = undefined;

            } , null, true, 'Asia/Kolkata');
            
            resolve();
        })
    }


}
