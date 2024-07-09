const mongoose = require('mongoose');

async function connectDB (){
    try {
        await mongoose.connect(`${process.env.DB_CONNECTION_URL}`)
        console.log("db connected")
    } catch (error) {
        console.log(error)
    }
}

module.exports = connectDB