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

// Importing routes from a separate file
import userRouter from "./routes/user.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import videoRouter from "./routes/video.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";


// Declaring routes 
app.use("/api/v1/users", userRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/tweet", tweetRouter);
app.use("/api/v1/video", videoRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/dashboard", dashboardRouter);

// Example route: http://localhost:8000/api/v1/users/register

export { app };
