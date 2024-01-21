import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// Asynchronous function to establish a connection to MongoDB
const connectDB = async () => {
    try {
        // Connecting to MongoDB using the Mongoose library
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        
        // Logging successful connection details
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        // Handling errors during MongoDB connection
        console.log("MongoDB Connection Failed ", error);
        process.exit(1); // Exiting the process with an error code if the connection fails
    }
};

export default connectDB;
