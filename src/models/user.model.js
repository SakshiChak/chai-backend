import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Define the User schema
const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },

        // URL of the user's avatar (stored on Cloudinary)
        avatar: {
            type: String,
            required: true,
        },

        // URL of the user's cover image (stored on Cloudinary)
        coverImage: {
            type: String,
        },

        // Array of video IDs representing the user's watch history
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video",
            },
        ],

        // User's password (hashed using bcrypt)
        password: {
            type: String,
            required: [true, "Password is required"],
        },

        // Refresh token for token refresh functionality
        refreshToken: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Middleware to hash the password before saving the user to the database
userSchema.pre("save", async function (next) {
    // Check if the password has been modified before hashing
    if (!this.isModified("password")) return next();

    // Hash the user's password using bcrypt
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Method to check if the entered password is correct
userSchema.methods.isPasswordCorrect = async function (password) {
    // Compare entered password with the hashed password in the database
    return await bcrypt.compare(password, this.password);
};

// Method to generate an access token for authentication
userSchema.methods.generateAccessToken = function () {
    // Sign a JWT with user information and secret for access token
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};

// Method to generate a refresh token for token refresh
userSchema.methods.generateRefreshToken = function () {
    // Sign a JWT with user ID and secret for refresh token
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};

// Create the User model
export const User = mongoose.model("User", userSchema);