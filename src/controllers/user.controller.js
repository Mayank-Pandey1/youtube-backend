import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating user and access token")
    }
}

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

const loginUser = asyncHandler( async (req, res) => {
    //get user data from req.body
    //login based on username or email
    //find the user in database
    // if user found -> check password

    //if password correct - generate access and refresh tokens

    //send tokens in cookies
    //send response
    
    console.log(req.body)
    const { username, email, password } = req.body
    
    if(!username && !email) throw new ApiError(400, "Username or email absent")

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(!user) throw new ApiError(404, "User doesn't exist")

    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid) throw new ApiError(401, "Invalid user credentials")

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
              .cookie("accessToken", accessToken, options)
              .cookie("refreshToken", refreshToken, options)
              .json(new ApiResponse(200, {user: loggedInUser, accessToken, refreshToken}, "User logged in successfully"))
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id,        //we designed auth middleware to get access to req.user
                          {$set: {refreshToken: undefined}},
                          {new: true})
    
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
              .clearCookie("accessToken")
              .clearCookie("refreshToken")
              .json(new ApiResponse(200, {}, "User logged out successfully"))
})

const refreshAccessToken = asyncHandler (async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.header("Authorization")?.replace("Bearer ", "")   //if sending through android application
    
    if(!incomingRefreshToken) throw new ApiError(401, "Unauthorized Request")
        
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)    //the decoded token is actually a payload which will have id
    
    const user = await User.findById(decodedToken?._id)
    
    if(!user) throw new ApiError(401, "Invalid Refresh Token")

    if(incomingRefreshToken !== user?.refreshToken) throw new ApiError(401, "Refresh token is expired or used")
    
    const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)

    const options = {
        httpOnly: true,
        secure: true
    }
    
    return res.status(200)
              .cookie("accessToken", accessToken, options)
              .cookie("refreshToken", newRefreshToken, options)
              .json(new ApiResponse(200, {accessToken, refreshToken: newRefreshToken}, "Access token refreshed successfully"))
})

export {registerUser, loginUser, logoutUser, refreshAccessToken}