import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // check validations - no fields are empty
    //check if user already exists
    //check for images - check for avatar
    //upload them to cloudinary, avatar
    // create user object, insert in db

    //remove password and refreshToken from response
    //return response
    //check if response is OK

    const {username, email, fullname, password} = req.body   //req.body contains data when sent through forms or json format
    
    if(
        [username, email, fullname, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    //now we have to contact with database, so we can use the model because it is created using mongoose
    const existingUser = await User.findOne({ $or:  [{ username }, { email }] })
    if(existingUser) throw new ApiError(409, "User already exists")

    //checking if images are available
    const avatarImageLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files?.coverImage[0]?.path;
    }

    if(!avatarImageLocalPath) throw new ApiError(400, "Avatar image is required")

    //uploading images to cloudinary 
    const avatarImage = await uploadOnCloudinary(avatarImageLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatarImage) throw new ApiError(400, "Avatar not found")
    
    //create entry in database
    const user = await User.create({
        username: username.toLowerCase(),
        email,
        fullname, 
        avatar: avatarImage.url,
        coverImage: coverImage?.url || "",
        password,
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser) throw new ApiError(500, "Something went wrong while registering the user")

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User Registered Successfully")
    )
} )

export {registerUser}