const ping = require('ping');

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
]

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
            module.exports.pingHosts().then((hosts) => {
                for (var i = 0; i < Prev_Status.length; i++) {
                    
                    if (Prev_Status[i].status !== hosts[i].status) {
                        if (Prev_Status[i].status !== '') {
                            console.log("Change in status detected for host: " + hosts[i].name);
                            console.log("Previous status: " + Prev_Status[i].status);
                            console.log("New status: " + hosts[i].status);
                            console.log("\n");
                        }
                        Prev_Status[i].status = hosts[i].status;
                    }

                }
                resolve(hosts);
            }).catch((err) => {
                console.log(err);
            });
        })
    }

}
