import { asyncHandler } from "../utils/asyncHandler.js";

// Define an asynchronous route handler using asyncHandler
const registerUser = asyncHandler( async (req, res) => {
    res.status(200).json({
        message: "chai-aur-code"
    });
});

// Export the registerUser function
export { registerUser};
