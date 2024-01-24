import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Define an asynchronous function to generate access and refresh tokens for a given user ID
const generateAccessAndRefereshTokens = async (userId) => {
    try {
        // Find the user in the database based on the provided user ID
        const user = await User.findById(userId)

        // Generate an access token using a method on the user object
        const accessToken = user.generateAccessToken()

        // Generate a refresh token using a method on the user object
        const refreshToken = user.generateRefreshToken()

        // Update the user's refresh token in the database
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        // Return the generated access and refresh tokens as an object
        return { accessToken, refreshToken }
    } catch (error) {
        // If an error occurs during the process, throw a custom API error with a 500 status code
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

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
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
    
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

// Define an asynchronous function to handle user login
const loginUser = asyncHandler(async (req, res) =>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    // Extract email, username, and password from the request body
    const {email, username, password} = req.body
    console.log(email);

    // Check if either username or email is provided; throw an error if not
    if (!username && !email) {
        throw new ApiError(400, "Username or email is required")
    }
    
    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
        
    // }

    // Find the user in the database based on either username or email
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    // Throw an error if the user is not found
    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    // Check if the provided password is valid for the user
    const isPasswordValid = await user.isPasswordCorrect(password)

    // Throw an error if the password is not valid
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    // Generate access and refresh tokens for the authenticated user
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)

    // Retrieve the logged-in user's information excluding password and refresh token
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // Define options for the HTTP-only and secure cookies
    const options = {
        httpOnly: true,
        secure: true
    }


    // Send the response with status 200, set cookies, and return user and token information
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})

// Define an asynchronous function to handle user logout
const logoutUser = asyncHandler(async (req, res) => {
    // Find and update the user document by unsetting the refreshToken field
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from the document
            }
        },
        {
            new: true
        }
    );

    // Define options for the HTTP-only and secure cookies
    const options = {
        httpOnly: true,
        secure: true
    };

    // Send the response with status 200, clear access and refresh cookies, and return success message
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"));
})

// Define an asynchronous route handler for refreshing access token
const refreshAccessToken = asyncHandler(async (req, res) => {
    // Extract the refresh token from either cookies or request body
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    // Check if the refresh token is present
    if (!incomingRefreshToken) {
        // Throw an error if the refresh token is not provided
        throw new ApiError(401, "unauthorized request");
    }

    try {
        // Verify the incoming refresh token using the secret key
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        // Find the user associated with the decoded token's user ID
        const user = await User.findById(decodedToken?._id);

        // Throw an error if the user is not found
        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        // Check if the incoming refresh token matches the stored refresh token
        if (incomingRefreshToken !== user?.refreshToken) {
            // Throw an error if the refresh token is expired or used
            throw new ApiError(401, "Refresh token is expired or used");
        }

        // Set options for the new cookies (httpOnly and secure)
        const options = {
            httpOnly: true,
            secure: true
        };

        // Generate new access and refresh tokens for the user
        const { accessToken, newRefreshToken } = await generateAccessAndRefereshTokens(user._id);

        // Send the response with new cookies and a JSON response
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200, 
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            );
    } catch (error) {
        // Throw an error if any issues occur during the token refresh process
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    // Destructuring oldPassword and newPassword from the request body
    const { oldPassword, newPassword } = req.body;

    // Finding the user by ID using the User model
    const user = await User.findById(req.user?._id);

    // Checking if the provided old password is correct using the user's method
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    // If the old password is incorrect, throw an ApiError with status code 400
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password");
    }

    // Setting the user's password to the new password
    user.password = newPassword;

    // Saving the user's document with validateBeforeSave set to false
    // This is done to bypass Mongoose validation as it may require the old password
    await user.save({ validateBeforeSave: false });

    // Returning a JSON response with status code 200 and a success message
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
})

const getCurrentUser = asyncHandler(async (req, res) => {
    // Returning a JSON response with status code 200 and the current user information
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user, // The user object obtained from the authenticated request
        "User fetched successfully"
    ))
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    // Destructuring fullName and email from the request body
    const { fullName, email } = req.body;

    // Checking if fullName and email are provided in the request body
    if (!fullName || !email) {
        // Throwing an ApiError with status code 400 and a message if any field is missing
        throw new ApiError(400, "All fields are required");
    }

    // Updating the user's account details using the User model and findByIdAndUpdate
    const user = await User.findByIdAndUpdate(
        req.user?._id, // User ID obtained from the authenticated request
        {
            $set: {
                fullName, // Updating fullName field
                email: email, // Updating email field
            },
        },
        { new: true } // Returning the updated document instead of the original
    ).select("-password"); // Excluding the password field from the response

    // Returning a JSON response with status code 200 and a success message
    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"));
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    // Getting the local path of the uploaded avatar file from the request
    const avatarLocalPath = req.file?.path;

    // If the avatar file is missing, throw an ApiError with status code 400
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }


    // TODO: Delete old image - Assignment (You can add the logic for deleting the old image here)

    // Fetching the user to get the current avatar URL
    const currentUser = await User.findById(req.user?._id);

    // Deleting the old avatar from Cloudinary if it exists
    if (currentUser.avatar) {
        // Extracting the public ID from the Cloudinary URL
        const publicId = currentUser.avatar.split('/').pop().split('.')[0];

        try {
            // Deleting the old avatar using the Cloudinary API
            await cloudinary.uploader.destroy(publicId);
        } catch (error) {
            // Handling errors that may occur during the deletion process
            throw new ApiError(500, 'Internal Server Error');
        }
    }


    // Uploading the avatar image to Cloudinary and obtaining the result
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    // If there is an error while uploading the avatar, throw an ApiError with status code 400
    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading the avatar");
    }

    // Updating the user's avatar URL in the database using findByIdAndUpdate
    const user = await User.findByIdAndUpdate(
        req.user?._id, // User ID obtained from the authenticated request
        {
            $set: {
                avatar: avatar.url, // Updating the avatar field with the new URL
            },
        },
        { new: true } // Returning the updated document instead of the original
    ).select("-password"); // Excluding the password field from the response

    // Returning a JSON response with status code 200 and a success message
    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Avatar image updated successfully")
        );
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    // Getting the local path of the uploaded cover image file from the request
    const coverImageLocalPath = req.file?.path;

    // If the cover image file is missing, throw an ApiError with status code 400
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing");
    }

    // TODO: Delete old image - Assignment (You can add the logic for deleting the old cover image here)

    // Fetching the user to get the current cover image URL
    const currentUser = await User.findById(req.user?._id);

    // Deleting the old cover image from Cloudinary if it exists
    if (currentUser.coverImage) {
        // Extracting the public ID from the Cloudinary URL
        const publicId = currentUser.coverImage.split('/').pop().split('.')[0];

        try {
            // Deleting the old cover image using the Cloudinary API
            await cloudinary.uploader.destroy(publicId);
        } catch (error) {
            // Handling errors that may occur during the deletion process
            throw new ApiError(500, 'Internal Server Error');
        }
    }

    // Uploading the cover image to Cloudinary and obtaining the result
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    // If there is an error while uploading the cover image, throw an ApiError with status code 400
    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading the cover image");
    }

    // Updating the user's cover image URL in the database using findByIdAndUpdate
    const user = await User.findByIdAndUpdate(
        req.user?._id, // User ID obtained from the authenticated request
        {
            $set: {
                coverImage: coverImage.url, // Updating the coverImage field with the new URL
            },
        },
        { new: true } // Returning the updated document instead of the original
    ).select("-password"); // Excluding the password field from the response

    // Returning a JSON response with status code 200 and a success message
    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Cover image updated successfully")
        );
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
};
