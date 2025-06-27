import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))

app.use(cookieParser())    //use to perform CRUD operations on user browser's cookies from server
                            //(there are some ways using whcih we can keep secure cookies in user's browser, those cookies can only be accessed by server)


export default app;