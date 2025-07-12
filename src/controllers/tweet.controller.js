import { Tweet } from "../models/tweet.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    const {owner, content} = req.body;

    if(!content || !owner) throw new ApiError(400, "content or owner of tweet not found!")

    const tweet = await Tweet.create({owner: owner, content: content})

    const createdTweet = await Tweet.findById(tweet._id)
    if(!createdTweet) throw new ApiError(500, "Something went wrong while tweeting!")

    return res.status(200)
              .json(new ApiResponse(200, createdTweet, "Tweeted successfully!"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params;
    //console.log(userId)

    if(!userId) throw new ApiError(400, "User not found!")
    
    const tweets = await Tweet.aggregate([
        {
            $match: {owner: new mongoose.Types.ObjectId(userId)}  //converts userId to mongoDB ObjectId type
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        { 
            $unwind: "$owner"    //to flatten the array(would be helpful in viewing individual tweets)
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                "owner._id": 1,
                "owner.username": 1,
                "owner.fullname": 1,
                "owner.avatar": 1
            }
        },
        { 
            $sort: { createdAt: -1 }    //-1 => newest to oldest/descending order, 1-oldest to newest/ascending order
        }
    ])
    //console.log(tweets)

    return res.status(200)
              .json(new ApiResponse(200, tweets, "User Tweets fetched successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;
    const { content } = req.body;

    if(!tweetId) throw new ApiError(400, "Tweet id not found")
    if (!content || !content.trim()) {
        throw new ApiError(400, "Tweet content cannot be empty");
    }
    
    const updatedTweet = await Tweet.findByIdAndUpdate(
                                                        tweetId,
                                                        { content: content.trim() },
                                                        { new: true }
                                                    );

    if(!updatedTweet) throw new ApiError(500, "Error while updating tweet!")
    
    return res.status(200)
              .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;

    if(!tweetId) throw new ApiError(400, "Tweet id not found")

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
    if(!deletedTweet) throw new ApiError(404, "Tweet not found!")

    return res.status(200)
              .json(new ApiResponse(200, {}, "Tweet deleted successfully!"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}