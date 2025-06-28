//asyncHandler is a higher order function: HOF accepts another function as parameter or can return a function 

const asyncHandler = (requestHandler) => { 
    return (req, res, next) => {
        Promise
            .resolve(requestHandler(req, res, next))
            .catch((error) => next(error))
}}


// const asyncHandler = (func) => { async (req, res, next) => {
//     try {
//         await func(req, res, next);
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }}

export { asyncHandler }