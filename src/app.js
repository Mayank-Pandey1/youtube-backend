import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "32kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))

app.use(cookieParser())    //use to perform CRUD operations on user browser's cookies from server
                            //(there are some ways using whcih we can keep secure cookies in user's browser, those cookies can only be accessed by server)


//routes import
import userRouter from "./routes/user.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"
import likeRouter from "./routes/like.routes.js"
import playlistRouter from "./routes/playlist.routes.js"

//routes declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/dashboard", dashboardRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/ap1/v1/playlist", playlistRouter)

export default app;