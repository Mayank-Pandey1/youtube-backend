import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {name: "avatar", maxCount: 1},   //name should be same as front-end field
        {name: "coverImage", maxCount: 1}
    ]),
    registerUser)

router.route("/login").post(upload.none(), loginUser)    //upload.none() is used as Even if you’re not uploading files, using form-data in Postman requires multer to parse the body

router.route("/logout").post(verifyJWT, logoutUser)

router.route("/refresh-token").post(refreshAccessToken)

export default router;