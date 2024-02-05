import mongoose, {isValidObjectId} from "mongoose"
import { Playlist , Video } from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


// Async route handler to create a playlist
const createPlaylist = asyncHandler(async (req, res) => {
    // Destructuring name and description from the request body
    const { name, description } = req.body;

    // Check if both name and description are provided
    if (!name || !description) {
        // Throw an error with a 400 status if either name or description is missing
        throw new ApiError(400, "name and description both are required");
    }

    // Create a new playlist using the Playlist model and the provided data
    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id,
    });

    // Check if the playlist creation was successful
    if (!playlist) {
        // Throw an error with a 500 status if the creation failed
        throw new ApiError(500, "failed to create playlist");
    }

    // Return a JSON response with a 200 status, the created playlist, and a success message
    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "playlist created successfully"));
})

// Async route handler to get playlists of a specific user
const getUserPlaylists = asyncHandler(async (req, res) => {
    // Extract userId from request parameters
    const { userId } = req.params;

    // Check if userId is a valid MongoDB ObjectId
    if (!isValidObjectId(userId)) {
        // Throw an error with a 400 status if userId is invalid
        throw new ApiError(400, "Invalid userId");
    }

    // Use aggregation pipeline to fetch playlists of the specified user
    const playlists = await Playlist.aggregate([
        {
            // Match playlists owned by the specified user
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            // Perform a lookup to get video details for each playlist
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            // Add fields to each playlist document: totalVideos and totalViews
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum: "$videos.views"
                }
            }
        },
        {
            // Project only the necessary fields for the response
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                totalVideos: 1,
                totalViews: 1,
                updatedAt: 1
            }
        }
    ]);

    // Return a JSON response with a 200 status, the fetched playlists, and a success message
    return res
        .status(200)
        .json(new ApiResponse(200, playlists, "User playlists fetched successfully"));
})

// Async route handler to get a playlist by its ID
const getPlaylistById = asyncHandler(async (req, res) => {
    // Extract playlistId from request parameters
    const { playlistId } = req.params;

    // Check if playlistId is a valid MongoDB ObjectId
    if (!isValidObjectId(playlistId)) {
        // Throw an error with a 400 status if playlistId is invalid
        throw new ApiError(400, "Invalid PlaylistId");
    }

    // Find the playlist by its ID
    const playlist = await Playlist.findById(playlistId);

    // Check if the playlist is not found
    if (!playlist) {
        // Throw an error with a 404 status if the playlist is not found
        throw new ApiError(404, "Playlist not found");
    }

    // Use aggregation pipeline to fetch detailed information about the playlist
    const playlistVideos = await Playlist.aggregate([
        {
            // Match playlists with the specified ID
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            // Lookup videos associated with the playlist
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
            }
        },
        {
            // Match only published videos
            $match: {
                "videos.isPublished": true
            }
        },
        {
            // Lookup owner details
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
            }
        },
        {
            // Add fields for totalVideos, totalViews, and owner
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum: "$videos.views"
                },
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            // Project only the necessary fields for the response
            $project: {
                name: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                totalVideos: 1,
                totalViews: 1,
                videos: {
                    _id: 1,
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    createdAt: 1,
                    views: 1
                },
                owner: {
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1
                }
            }
        }
    ]);

    // Return a JSON response with a 200 status, the fetched playlist information, and a success message
    return res
        .status(200)
        .json(new ApiResponse(200, playlistVideos[0], "Playlist fetched successfully"));
})

// Async route handler to add a video to a playlist
const addVideoToPlaylist = asyncHandler(async (req, res) => {
    // Extract playlistId and videoId from request parameters
    const { playlistId, videoId } = req.params;

    // Check if both playlistId and videoId are valid MongoDB ObjectIds
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        // Throw an error with a 400 status if either playlistId or videoId is invalid
        throw new ApiError(400, "Invalid PlaylistId or videoId");
    }

    // Find the playlist and video by their respective IDs
    const playlist = await Playlist.findById(playlistId);
    const video = await Video.findById(videoId);

    // Check if the playlist and video are not found
    if (!playlist) {
        // Throw an error with a 404 status if the playlist is not found
        throw new ApiError(404, "Playlist not found");
    }
    if (!video) {
        // Throw an error with a 404 status if the video is not found
        throw new ApiError(404, "Video not found");
    }

    // Check if the user making the request is the owner of both the playlist and the video
    if (
        (playlist.owner?.toString() && video.owner.toString()) !==
        req.user?._id.toString()
    ) {
        // Throw an error with a 400 status if the user is not the owner
        throw new ApiError(400, "Only the owner can add a video to their playlist");
    }

    // Update the playlist by adding the videoId to the 'videos' array
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlist?._id,
        {
            $addToSet: {
                videos: videoId,
            },
        },
        { new: true }
    );

    // Check if the playlist update was successful
    if (!updatedPlaylist) {
        // Throw an error with a 400 status if the update fails
        throw new ApiError(400, "Failed to add video to playlist, please try again");
    }

    // Return a JSON response with a 200 status, the updated playlist, and a success message
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "Added video to playlist successfully"
            )
        );
})

// Async route handler to remove a video from a playlist
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    // Extract playlistId and videoId from request parameters
    const { playlistId, videoId } = req.params;

    // Check if both playlistId and videoId are valid MongoDB ObjectIds
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        // Throw an error with a 400 status if either playlistId or videoId is invalid
        throw new ApiError(400, "Invalid PlaylistId or videoId");
    }

    // Find the playlist and video by their respective IDs
    const playlist = await Playlist.findById(playlistId);
    const video = await Video.findById(videoId);

    // Check if the playlist and video are not found
    if (!playlist) {
        // Throw an error with a 404 status if the playlist is not found
        throw new ApiError(404, "Playlist not found");
    }
    if (!video) {
        // Throw an error with a 404 status if the video is not found
        throw new ApiError(404, "Video not found");
    }

    // Check if the user making the request is the owner of both the playlist and the video
    if (
        (playlist.owner?.toString() && video.owner.toString()) !==
        req.user?._id.toString()
    ) {
        // Throw an error with a 404 status if the user is not the owner
        throw new ApiError(404, "Only the owner can remove a video from their playlist");
    }

    // Update the playlist by pulling the videoId from the 'videos' array
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: videoId,
            },
        },
        { new: true }
    );

    // Return a JSON response with a 200 status, the updated playlist, and a success message
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "Removed video from playlist successfully"
            )
        );
})

// Async route handler to delete a playlist
const deletePlaylist = asyncHandler(async (req, res) => {
    // Extract playlistId from request parameters
    const { playlistId } = req.params;

    // Check if playlistId is a valid MongoDB ObjectId
    if (!isValidObjectId(playlistId)) {
        // Throw an error with a 400 status if playlistId is invalid
        throw new ApiError(400, "Invalid playlistId");
    }

    // Find and delete the playlist by its ID
    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

    // Check if the playlist deletion was successful
    if (!deletedPlaylist) {
        // Throw an error with a 400 status if the deletion fails
        throw new ApiError(400, "Something went wrong while deleting playlist");
    }

    // Return a JSON response with a 200 status, an empty object, and a success message
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Playlist Deleted Successfully"));
})

// Async route handler to update a playlist
const updatePlaylist = asyncHandler(async (req, res) => {
    // Destructure name, description, and playlistId from the request body and parameters
    const { name, description } = req.body;
    const { playlistId } = req.params;

    // Check if both name and description are provided
    if (!name || !description) {
        // Throw an error with a 400 status if either name or description is missing
        throw new ApiError(400, "Name and description both are required");
    }

    // Check if playlistId is a valid MongoDB ObjectId
    if (!isValidObjectId(playlistId)) {
        // Throw an error with a 400 status if playlistId is invalid
        throw new ApiError(400, "Invalid PlaylistId");
    }

    // Find the playlist by its ID
    const playlist = await Playlist.findById(playlistId);

    // Check if the playlist is not found
    if (!playlist) {
        // Throw an error with a 404 status if the playlist is not found
        throw new ApiError(404, "Playlist not found");
    }

    // Check if the user making the request is the owner of the playlist
    if (playlist.owner.toString() !== req.user?._id.toString()) {
        // Throw an error with a 400 status if the user is not the owner
        throw new ApiError(400, "Only the owner can edit the playlist");
    }

    // Update the playlist with the new name and description
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlist?._id,
        {
            $set: {
                name,
                description,
            },
        },
        { new: true }
    );

    // Return a JSON response with a 200 status, the updated playlist, and a success message
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "Playlist updated successfully"
            )
        );
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}