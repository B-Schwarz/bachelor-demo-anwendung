const mongoose = require('mongoose');
const { User } = require("./models/user.model");


//Create connection
const connectDB = async () => {
    await mongoose.connect(process.env.DB_URI).then(() => {
        console.log("Erfolgreiche Datenbankverbindung")
    }).catch((e) => {
        console.error(e)
    })
}

module.exports = {
    connectDB
}