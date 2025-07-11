import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
    atComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    },
    atVideo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    },
    atTweet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tweet"
    },
    likedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, {timestamps: true})

export const Like = mongoose.model("Like", likeSchema)