// Importing required packages for the Express app
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Creating an instance of the Express app
const app = express();

// Configuring CORS middleware to handle cross-origin requests
app.use(cors({
    origin: process.env.CORS_ORIGIN,   // Allowing requests from a specific origin (configured via environment variable)
    credentials: true                   // Allowing credentials (e.g., cookies) to be sent with cross-origin requests
}))

// Configuring middleware to parse JSON requests and limit their size to 16kb
app.use(express.json({ limit: "16kb" }))

// Configuring middleware to parse URL-encoded requests, allowing extended syntax, and limiting their size to 16kb
app.use(express.urlencoded({ extended: true, limit: "16kb" }))

// Serving static files from the "public" directory
app.use(express.static("public"))

// Configuring middleware to parse cookies
app.use(cookieParser())

// Importing user routes from a separate file
import userRouter from './routes/user.routes.js' 

// Declaring routes for users
app.use("/api/v1/users", userRouter)

// Example route: http://localhost:8000/api/v1/users/register

export { app };
