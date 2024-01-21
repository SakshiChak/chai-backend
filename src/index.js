// require('dotenv').config({path:'./env'})
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import {app} from './app.js'

// Configuring environment variables from a .env file
dotenv.config({
    path: "./env",
});

// Connecting to MongoDB
connectDB()
.then(() => {
    // Handling errors during Express app initialization
    app.on("error", (error) => {
        console.log("ERROR: ", error);
        throw error;
    });

    // Starting the Express app and listening on the specified port or defaulting to 8000
    app.listen(process.env.PORT || 8000, () => {
        console.log(`⚙️  Server is running at port : ${process.env.PORT}`);
    });
})
.catch((err) => {
    console.log("MongoDB connection failed !!! ", err);
});

/*
import express from "express";
const app = express();

(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on("error", (error) => {
            console.log("ERROR: ", error);
            throw error;
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })

    } catch (error) {
        console.error("ERROR: ", error);
        throw error;
    }

})();
*/
