const ping = require('ping');
var nodemailer = require('nodemailer');
var handlebars = require('handlebars');

const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, './templates/notify-email.hbs');
const source = fs.readFileSync(filePath, 'utf-8').toString();

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
        status: '',
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
            Hosts.forEach((host) => {
                var today = new Date();
                
                host.date = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
                host.time = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;
                
                ping.sys.probe(host.ip, (active) => {
                    active ? host.status = 'Active' : host.status = 'Inactive';
                });
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

                            await module.exports.saveHostsOntoTextFile(hosts);
                            await module.exports.curateEmailMessage(hosts, hosts[i]).then((message) => {
                                console.log(message);
                                module.exports.sendEmail(hosts, message);
                            }).catch((err) => {
                                console.log(err);
                            });
                            
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

            console.log("Sending email...");
            console.log("\n" + message);
            
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            var emailAddress = process.env.EMAIL_TO.split(',');
            
            emailAddress.forEach(email => {
                
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

    curateEmailMessage: (hosts, item) => {
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
    }

}
