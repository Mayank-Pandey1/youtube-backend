import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {   //verifying if user is logged in
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")   //if sending through android application

        if(!token) throw new ApiError(401, "Unauthorized Request")
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)    //the decoded token is actually a payload which will have id

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")   //finding user who made the request

        if(!user) throw new ApiError(401, "Invalid Access Token")
        
        req.user = user;
        // console.log(req.user)
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access token")
    }
})