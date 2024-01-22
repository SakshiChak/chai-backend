import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

// Define middleware function to verify JWT tokens
export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        // Extract access token from cookies or authorization header
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        
        // Throw an error if no token is found
        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }
    
        // Verify the access token using the secret key
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        // Find user by the decoded token's ID, excluding password and refreshToken fields
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    
        // Throw an error if the user is not found
        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }
    
        // Attach the user information to the request object for subsequent middleware
        req.user = user;
        next();
    } catch (error) {
        // Throw an API error with a 401 status code and an error message
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});