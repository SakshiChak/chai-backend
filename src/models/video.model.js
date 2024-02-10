import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// Define the Video schema
const videoSchema = new Schema(
    {
        // Cloudinary URL for the video file
        videoFile: {
            type: {
                url: String,
                public_id: String,
            },
            required: true,
        },
        // Cloudinary URL for the video thumbnail
        thumbnail: {
            type: {
                url: String,
                public_id: String,
            },
            required: true,
        },
        // Title of the video
        title: {
            type: String,
            required: true,
        },
        // Description of the video
        description: {
            type: String,
            required: true,
        },
        // Duration of the video in seconds
        duration: {
            type: Number,
            required: true,
        },
        // Number of views for the video (default is 0)
        views: {
            type: Number,
            default: 0,
        },
        // Boolean indicating whether the video is published or not (default is false)
        isPublished: {
            type: Boolean,
            defaultValue: false,
        },
        // Reference to the owner user using their ObjectId
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,  // Automatically manage createdAt and updatedAt timestamps
    }
);

// Add pagination plugin to the schema
videoSchema.plugin(mongooseAggregatePaginate);


// Create the Video model
export const Video = mongoose.model("Video", videoSchema);
