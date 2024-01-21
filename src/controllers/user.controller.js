import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Define an asynchronous route handler using asyncHandler
const registerUser = asyncHandler(async (req, res) => {

    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    // Extract user details from the request body
    const { fullName, email, username, password } = req.body;

    // Validate that none of the required fields are empty
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // Check if a user with the same username or email already exists
    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    // Get the local path of the avatar and cover image files
    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath;

    // Check if coverImage file exists in the request
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    // Check if avatar file is provided
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    // Upload avatar and coverImage files to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    // Check if avatar upload was successful
    if (!avatar) {
        throw new ApiError(400, "Avatar file upload failed");
    }

    // Create a new user in the database
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    });

    // Retrieve the created user excluding sensitive information
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    // Check if user creation was successful
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    // Return a success response with the created user data
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
});

export { registerUser };
