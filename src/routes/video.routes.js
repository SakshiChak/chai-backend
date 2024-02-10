import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    updateVideo,
    publishAVideo,
    togglePublishStatus
} from "../controllers/video.controller.js";

const router = Router();

// Middleware to verify JWT token before accessing routes
// router.use(verifyJWT);

// Route for handling requests to get all videos and publish a video
router
    .route("/")
    .get(getAllVideos) // Get all videos
    .post(
        verifyJWT, // Verify JWT token before publishing a video
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1
            },
            {
                name: "thumbnail",
                maxCount: 1
            }
        ]),
        publishAVideo // Publish a video
    );

// Routes for specific video based on video ID
router
    .route("/v/:videoId")
    .get(verifyJWT, getVideoById) // Get a specific video by ID
    .delete(verifyJWT, deleteVideo) // Delete a video by ID
    .patch(verifyJWT, upload.single("thumbnail"), updateVideo); // Update a video by ID

// Route to toggle publish status of a video
router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);

export default router;
