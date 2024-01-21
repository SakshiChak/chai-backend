// Custom ApiResponse class for representing API responses
class ApiResponse {
    // Constructor for creating instances of ApiResponse
    constructor(
        statusCode,                 // HTTP status code of the API response
        data,                       // Data payload of the API response
        message = "Success"         // Default success message if not provided
    ) {
        // Sets the HTTP status code property
        this.statusCode = statusCode;

        // Sets the data payload property
        this.data = data;

        // Sets the message property
        this.message = message;

        // Sets the success property based on the HTTP status code
        // If status code is less than 400, success is true; otherwise, it's false
        this.success = statusCode < 400;
    }
}

export { ApiResponse }
