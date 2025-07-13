import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.models.js";
import { Like } from "../models/like.models.js";
import { Subscription } from "../models/subscription.models.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getChannelStats = asyncHandler(async (req, res) => {

    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, "Unauthorized");

    //matches all videos of current userId and find total videos(group) of that user(add 1 for each video) 
    // and total views accross all videos(add number of views of each video together)
    const videoStats = await Video.aggregate([
                                                { $match: { owner: new mongoose.Types.ObjectId(userId) } },
                                                {
                                                $group: {
                                                    _id: null,
                                                    totalVideos: { $sum: 1 },
                                                    totalViews: { $sum: "$views" }
                                                }
                                                }
                                            ]);
    if(!videoStats) throw new ApiError(500, "Error while fetching video stats!")

    //Find all videos where the owner is the current user (userId)
    //Only return the _id field from each matching document (to minimize data transfer)
    const userVideos = await Video.find({ owner: userId }, { _id: 1 });
    const videoIds = userVideos.map(video => video._id);

    //How many Like documents exist where in a like document the atVideo field is any of these user’s videos?
    const totalLikes = await Like.countDocuments({ atVideo: { $in: videoIds } });

    // Counting total subscribers
    const totalSubscribers = await Subscription.countDocuments({ channel: userId });

    // Building stats object
    const stats = {
        totalVideos: videoStats[0]?.totalVideos || 0,
        totalViews: videoStats[0]?.totalViews || 0,
        totalLikes: totalLikes || 0,
        totalSubscribers: totalSubscribers || 0
    };

    return res.status(200).json(new ApiResponse(200, stats, "Channel stats fetched"));
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const videos = await Video.find({ owner: userId }).sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
})

export {
    getChannelStats, 
    getChannelVideos
    }