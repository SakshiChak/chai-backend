import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configure Cloudinary with the provided environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Define an asynchronous function to upload a file to Cloudinary
const uploadOnCloudinary = async (localFilePath) => {
    try {
        // Check if the file path is provided
        if (!localFilePath) return null;

        // Upload the file to Cloudinary with auto-detection of the resource type
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        // file has been uploaded successfull
        //console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath);

        // Return the Cloudinary response object
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed

        // Return null to indicate the failure
        return null;
    }
};

// Export the upload function for use in other modules
export { uploadOnCloudinary };
