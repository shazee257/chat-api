'use strict';

const mongoose = require('mongoose');

module.exports = async () => {
    try {
        mongoose.set('strictQuery', true);
        await mongoose.connect(process.env.MONGODB_URL);
        console.log(`Connected to DB!`);
    } catch (error) {
        console.log("db error: ", error);
    }
}

