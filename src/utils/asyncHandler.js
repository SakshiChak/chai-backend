// asyncHandler utility function takes a requestHandler function as a parameter
const asyncHandler = (requestHandler) => {
    // Returns a middleware function with parameters req (request), res (response), and next (next middleware function)
    return (req, res, next) => {
        // Wraps the execution of the asynchronous requestHandler in a resolved Promise
        Promise.resolve(requestHandler(req, res, next))
            // Catches any errors that occur during the execution of the requestHandler
            .catch((err) => next(err));
    }
}

export { asyncHandler }


// const asyncHandler = () => { }
// const asyncHandler = (func) => () => { }
// const asyncHandler = () => async () => { }

/* try catch approach
const asyncHandler = (fn) => async (req, res, next) => {
    try {
            await fn(req, res, next)
    } catch (error) {
        res.status(err.code || 500).json({
            success: false,
            message:err.message
        })
    }
}
*/
