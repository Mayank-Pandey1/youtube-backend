import dotenv from 'dotenv'
dotenv.config({path: './env'});

import connectDB from './db/index.js';
import app from './app.js';

connectDB()
    .then(() => {
        app.on("error", (error) => {
            console.log("Error: ", error);
            throw error;
        })
        app.listen(process.env.PORT || 3000, () => {
            console.log(`Server is running at PORT: ${process.env.PORT}`);
        })
    })
    .catch((error) => { 
        console.log("MongoDB connection failed ", error)
    })






/*
//IIFE - Immediately invoked function epxression
;( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("ERROR: ", error);
            throw error;
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on PORT ${process.env.PORT}`);
        })
    } catch (error) {
        console.error("ERROR: ", error);
        throw error;
    }
} ) () 
*/