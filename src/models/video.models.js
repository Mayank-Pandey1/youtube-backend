import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema({
    videoFile: {
        type: String,  //cloudninary url 
        required: true
    },
    thumbnail: {
        type: String,    //cloudninary url
        required: true
    },
    title: {
        type: String, 
        required: true,
    },
    description: {
        type: String,
        required: true
    },
    duration: {
        type: Number,     //duration will be given by cloudinary only(after a file is uploaded, cloudinary provides information of file), not by the video owner(user)
        required: true
    },
    views: {
        type: Number,
        default: 0,
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, {timestamps: true})



mongoose.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema)