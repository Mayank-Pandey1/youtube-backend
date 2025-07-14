import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const userId = req.user?._id;
    
    if(!videoId) throw new ApiError(400, "Video id not found")
    if(!isValidObjectId(videoId)) throw new ApiError(400, "Invalid object id")

    const existingLike = await Like.findOne({likedBy: userId, atVideo: videoId})

    if (existingLike) {
        await existingLike.remove();
        return res.status(200).json(new ApiResponse(200, {}, "Like removed"));
    } else {
        await Like.create({ user: userId, atVideo: videoId });
        return res.status(201).json(new ApiResponse(201, {}, "Like added"));
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const userId = req.user?._id;
    
    if(!commentId) throw new ApiError(400, "Comment id not found")
    if(!isValidObjectId(commentId)) throw new ApiError(400, "Invalid comment id")

    const existingLike = await Like.findOne({likedBy: userId, atComment: commentId})

    if (existingLike) {
        await existingLike.remove();
        return res.status(200).json(new ApiResponse(200, {}, "Like removed"));
    } else {
        await Like.create({ user: userId, atComment: commentId });
        return res.status(201).json(new ApiResponse(201, {}, "Like added"));
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const userId = req.user?._id;
    
    if(!tweetId) throw new ApiError(400, "Tweet id not found")
    if(!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid tweet id")

    const existingLike = await Like.findOne({likedBy: userId, atTweet: tweetId})

    if (existingLike) {
        await existingLike.remove();
        return res.status(200).json(new ApiResponse(200, {}, "Like removed"));
    } else {
        await Like.create({ user: userId, atTweet: tweetId });
        return res.status(201).json(new ApiResponse(201, {}, "Like added"));
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    
    const userId = req.user?._id;

    const likedVideos = await Like.aggregate([
        {
            $match: {likedBy: new mongoose.Types.ObjectId(userId)}
        },
        {
            $lookup: {
                from: "videos",                   
                localField: "atVideo",           
                foreignField: "_id",              
                as: "videoDetails"
            }
        },
        {
            $unwind: "$videoDetails"
        },
        {
            $replaceRoot: { newRoot: "$videoDetails" }  // return just the video object, not the Like object
        },
        { $sort: { createdAt: -1 } }
    ])

    if(!likedVideos) throw new ApiError(500, "Error fetching liked videos")

    return res.status(200).json(new ApiResponse(200, likedVideos, "Liked videos fetch success"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}