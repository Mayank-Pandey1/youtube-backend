import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`MongoDB connected. MongoDB host: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("ERROR: ", error);
        process.exit(1);                //the app running on nodejs(which is a runtime env outside browser) is a process
    }
}

export default connectDB;