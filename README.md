# Network Monitor

### 🌟 Introduction
Network Monitoring Systems are software or hardware tools that can track various aspects of a network and its operation, such as traffic, bandwidth utilization, and uptime. Generally these systems can detect devices and other elements that comprise or touch the network, as well as provide status updates.

### 🌟 About the Project
Every enterprise uses a dedicated network security solution to manage and monitor their network activity. But a dedicated expensive tool like that is not essential, if the requirement is only a one or few among the above discussed. This project (as of now) serves only two of the above discussed feature : `Status Update` and `Downtime Tracking`.

### 🌟 Project Features
- `Network Status Monitor` with customizable frequency
- `Monitor any no: of network(s)` or server(s) at real-time
- `Recieve Status Alert` emails when there's a change in the network(s) or server(s) status
- `Get EOD Reports` via email with total downtime of each network(s) or server(s)
- `Multiple recipients` can be added to the sending list
- `Save logs in a text file` each time when there's a change in network(s) or server(s) status
- `Store total downtime in Database` for future analytics

### 🌟 Project Requirements
- **[Node.js](https://nodejs.org/en/)** - Run time Environment
- **[MongoDB](https://www.mongodb.com/try/download/community)** - Database
- **[Gmail](https://support.google.com/accounts/answer/6010255?hl=en)** - account with a `Less Secure App` and `2FA enabled`

### 🌟 Steps to run project
- Install the requirements
- Clone this repository
- Create a DB named `server-ping` and a collection named `daily_downtime` within MongoDB
- Install project dependencies
- Run the project using the command `npm start` or `npm run dev`

