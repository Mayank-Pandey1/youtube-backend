import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

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

    let coverImageLocalPath;     //setting coverImage is not manadatory while account creation
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

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body;

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect) throw new ApiError(400, "Invalid Password")

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200)
              .json(200, req.user, "Current user fetched successfully")
})

const updateAccountDetails = asyncHandler (async (req, res) => {
    const {fullname, email, username} = req.body

    if(!fullname || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
                           {
                            $set: {
                                fullname: fullname,
                                email: email,
                                username      
                            }
                           },
                           {new: true}   //the updated information is returned
                          ).select("-password -refreshToken")

    return res.status(200)
              .json(new ApiResponse(200, user, "Account updated successfully"))
})

const updateAvatarImage = asyncHandler (async (req, res) => {
    const avatarImageLocalPath = req.file?.path

    if(!avatarImageLocalPath) throw new ApiError(400, "Avatar image not found")

    const avatarImage = await uploadOnCloudinary(avatarImageLocalPath)

    if(!avatarImage.url) throw new ApiError("Avatar Image not found for upload on cloudinary")

    const user = await User.findByIdAndUpdate(req.user._id, 
                                            {  
                                                $set: {
                                                    avatar: avatarImage.url    
                                                }
                                            }, {new: true})

    return res.status(200)
              .json(new ApiResponse(200, {user}, "Avatar image updated successfully"))
})

const updateCoverImage = asyncHandler( async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath) throw new ApiError("Cover Image not found")

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage) throw new ApiError("Error while uploading cover image for update")
        
    const user = await User.findByIdAndUpdate(req.user._id, 
                                              {
                                                $set: {
                                                    coverImage: coverImage.url || ""
                                                }
                                              }, {new: true})

    return res.status(200)
              .json(new ApiResponse(200, {user}, "Cover image updated successfully"))
})

const getUserChannelProfile = asyncHandler( async (req, res) => {
    const {username} = req.params
    if(!username?.trim()) throw new ApiError("Username not found")
    
    const channel = User.aggregate([
                            {
                                $match: {username: username?.toLowerCase()}
                            },
                            {
                                $lookup: {      //who follows this user
                                    from: "subscriptions",
                                    localField: "_id",
                                    foreignField: "channel",   //channel is also a user, which stores only the object id of the user to which it refers, and not the entire user object 
                                    as: "subscribers"
                                }
                            }, 
                            {
                                $lookup: {    //who this user follows
                                    from: "subscriptions",
                                    localField: "_id",
                                    foreignField: "subscriber",   //subscriber is also a user, which stores only the object id of the user to which it refers, and not the entire user object
                                    as: "subscribedTo"
                                }
                            }, 
                            {
                                $addFields: {
                                    subscribersCount: {$size: "$subscribers"},
                                    channelsSubscribedToCount: {$size: "$subscribedTo"},
                                    isSubscribed: {$cond: {   //whether the current logged-in user is subscribed to this channel
                                        if: {$in: [req.user?.id, "$subscribers.subscriber"]},
                                        then: true,
                                        else: false
                                    }}
                                }
                            },
                            {
                                $project: {
                                    fullname: 1,
                                    username: 1,
                                    isSubscribed: 1,
                                    subscribersCount: 1,
                                    channelsSubscribedToCount: 1,
                                    isSubscribed: 1,
                                    coverImage: 1,
                                    avatar: 1,
                                    email: 1 
                                }
                            }
                        ])
    if(!channel?.length) throw new ApiError(404 ,"Channel does not exist")   
    
    return res.status(200)
            .json(new ApiResponse(200, channel[0], "User channel fetched successfully"))
})

const getUserWatchHistory = asyncHandler( async(req, res) => {
    const user = await User.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(req.user._id) } },
        { $lookup: {
            from: "videos",
            localField: "watchHistory",
            foreignField: "_id",
            as: "watchHistory",
            pipeline: [
                {
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner",
                        pipeline: [
                            {
                                $project: {
                                    fullname: 1,
                                    username: 1,
                                    avatar: 1
                                }
                            }
                        ]
                    }
                },
                {
                    $addFields: {
                        owner: {
                            $first: "$owner"
                        }
                    }
                }
            ]
        }},
    ])

    return res.status(200)
              .json(new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully"))
})

export {registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails, 
    updateAvatarImage, 
    updateCoverImage,
    getUserChannelProfile,
    getUserWatchHistory}