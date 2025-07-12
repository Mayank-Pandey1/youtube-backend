import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 10;
    const sortOrder = sortType === "asc" ? 1 : -1  ;
    const skip = (pageNumber - 1) * limitNumber;

    if(!userId) throw new ApiError(400, "User id not found")
    if(!isValidObjectId(userId)) throw new ApiError(400, "Invalid user id")
    
    const userVideos = await Video.aggregate([
        {$match: {owner: new mongoose.Types.ObjectId(userId)}},
        {$lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {$unwind: "$owner"},
        {$project: {
            videoFile: 1,
            title: 1,
            thumbnail: 1,
            description: 1,
            duration: 1,
            views: 1,
            "owner._id": 1,
            "owner.username": 1,
            "owner.fullname": 1,
            "owner.avatar": 1
        }},
        { $sort: { [sortBy]: sortOrder } },

        { $skip: skip },
        { $limit: limitNumber }
    ])

    console.log(userVideos)

    return res.status(200)
             .json(new ApiResponse(200, userVideos, "User videos fetched successfully"));
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body

    if(!title || !description) throw new ApiError(400, "Video title or desccription not found")
    
    let thumbnailLocalPath;    //uploading thumbnail file while uploading a video is not compulsory
    if(req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0) {
        thumbnailLocalPath = req.files?.thumbnail[0]?.path;   
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    if(!videoFileLocalPath) throw new ApiError(400, "Video file not found!")
    
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    const video = await uploadOnCloudinary(videoFileLocalPath);

    if(!video) throw new ApiError(400, "Video not found!");
    
    const videoDuration = video.duration;   //duration from cloudinary data

    const owner = await User.findById(req.user?._id).select("-password -refreshToken")

    //create entry in database
    const uploadedVideo = await Video.create({
        videoFile: video.url,
        thumbnail: thumbnail?.url || "",
        title: title,
        description: description,
        duration: videoDuration,
        views: 0,
        isPublished: false,
        owner: owner
    })

    if(!uploadedVideo) throw new ApiError(500, "Something went wrong while uploading the video")
    
    return res.status(200)
              .json(new ApiResponse(200, uploadedVideo, "Video uploaded successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!videoId) throw new ApiError(400, "Video id not found")
    
    const video = await Video.findById(videoId);
    if(!video) throw new ApiError(500, "Video not found")
    
    return res.status(200)
              .json(new ApiResponse(200, video, "Video found successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId) throw new ApiError(400, "Video id not found")

    const { title, description } = req.body
    const thumbnailLocalPath = req.file?.path

    let thumbnail;
    if(thumbnailLocalPath) {
        thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
        if(!thumbnail) throw new ApiError(500, "Error while uploading thumbnail on cloudinary")
    }

    const updateData = {};

    if (title) updateData.title = title.trim();
    if (description) updateData.description = description.trim();
    if (thumbnail?.url) updateData.thumbnail = thumbnail.url;
    
    const updatedVideo = await Video.findByIdAndUpdate(videoId, { $set: updateData }, { new: true })

    if(!updatedVideo) throw new ApiError(500, "Error while updating video")
    
    return res.status(200)
              .json(new ApiResponse(200, updatedVideo, "Video updated successfully"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!videoId) throw new ApiError(400, "Video id not found")
    
    const video = await Video.findByIdAndDelete(videoId);
    if(!video) throw new ApiError(500, "Video not found")
    
    return res.status(200)
              .json(new ApiResponse(200, video, "Video deleted successfully"))
    
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId) throw new ApiError(400, "Video id not found")
    
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    video.isPublished = !video.isPublished;

    const updatedVideo = await video.save();

    if(!updatedVideo) throw new ApiError(500, "Error while toggling publish status")

    return res.status(200)
              .json(new ApiResponse(200, {updatedVideo}, "Changed video publish status"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}