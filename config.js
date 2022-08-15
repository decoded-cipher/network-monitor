require('dotenv').config()

const MongoClient = require('mongodb').MongoClient
var database;

module.exports.connect = (callback) => {
    const url = process.env.DB_URL
    const dbname = process.env.DB_NAME

    MongoClient.connect(url, {useUnifiedTopology: true} ,(err, data) => {
        if (err) {
            return callback(err)
        }
        database = data.db(dbname)
        callback()

    })
}

module.exports.get = () => {
    return database
}