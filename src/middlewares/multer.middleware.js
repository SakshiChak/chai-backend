// Importing the 'multer' library for handling file uploads
import multer from "multer";

// Configuring storage settings for multer
const storage = multer.diskStorage({
    // Setting the destination folder where uploaded files will be stored
    destination: function (req, file, cb) {
        cb(null, "./public/temp");
    },
    
    // Setting the filename for the uploaded file to be the original name
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

// Creating a multer middleware with the specified storage configuration
export const upload = multer({
    storage,
});



