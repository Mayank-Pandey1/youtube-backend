import mongoose from "mongoose"
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.models.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    const pageNumber = parseInt(page)
    const limitNumber = parseInt(limit)
    const skip = (pageNumber - 1) * limitNumber

    if(!videoId) throw new ApiError(400, "Video ID not found")
    
    const comments = await Comment.aggregate([
        {$match: {video: new mongoose.Types.ObjectId(videoId)}},
        {$lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner"
        }},
        {$unwind: "$owner"},
        {$project: {
            content: 1,
            "owner._id": 1,
            "owner.username": 1,
            "owner.fullname": 1,
            "owner.avatar": 1
        }},

        { $sort:  { createdAt: -1 } },

        { $skip: skip },
        { $limit: limitNumber }
    ])

    if(!comments) throw new ApiError(500, "Video comments not found")
    
    return res.status(200)
              .json(new ApiResponse(200, comments, "Video comments fetch success"))
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params;
    const { content } = req.body;
    if( !videoId ) throw new ApiError(400, "Video ID not found");
    if( !content || !content.trim()) throw new ApiError(400, "Comment content not found!")

    const video = await Video.findById(videoId);
    if(!video) throw new ApiError(500, "Video not found")

    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const comment = await Comment.create({
        content: content,
        video: video._id,
        owner: userId
    })

    if(!comment) throw new ApiError(500, "Error while commenting")

    return res.status(200)
              .json(new ApiResponse(200, comment, "Comment success"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;
    if(!commentId) throw new ApiError(400, "Comment ID not found")

    const { content } = req.body;
    if(!content) throw new ApiError("Comment content not found")

    const updatedComment = await Comment.findByIdAndUpdate(commentId, {
                                                    $set: {content: content}
                                                    }, {new: true})

    if(!updatedComment) throw new ApiError(500, "Error while updating comment!")
    
    return res.status(200).json(new ApiResponse(200, updatedComment, "Comment update success"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;
    if(!commentId) throw new ApiError(400, "Comment ID not found")

    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if(!deletedComment) throw new ApiError(500, "Error while deleting comment!")
    
    return res.status(200).json(new ApiResponse(200, deletedComment, "Comment delete success"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }