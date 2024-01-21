// Custom ApiError class extending the built-in Error class
class ApiError extends Error {
    // Constructor for creating instances of ApiError
    constructor(
        statusCode,            // HTTP status code for the error
        message = "Something went wrong",  // Default error message if not provided
        errors = [],           // Array to store additional errors
        stack = ""             // Stack trace for debugging purposes
    ) {
        // Calls the constructor of the Error class with the provided message
        super(message);

        // Initializes properties specific to ApiError
        this.statusCode = statusCode; // HTTP status code of the error
        this.data = null;             // Placeholder for additional data (set to null)
        this.message = message;       // Error message
        this.success = false;         // Indicates whether the operation was successful (default is false)
        this.errors = errors;         // Array to store additional errors

        // Checks if a custom stack trace is provided, otherwise captures the stack trace
        if (stack) {
            this.stack = stack;       
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError }
