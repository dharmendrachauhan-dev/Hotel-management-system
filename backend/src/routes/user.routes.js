import { Router } from "express"
import {
    changeCurrentPassword,
    generateAccessToken,
    getCurrentUser,
    loginUser,
    logoutUser,
    registerUser,
    updateAccountDetails,
    updateAvatar
} from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middlewares.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/register").post(upload.single("avatar"), registerUser)
router.route("/login").post(loginUser)
router.route("/logout").patch(verifyJWT, logoutUser)
router.route("/refresh-token").post(generateAccessToken)
router.route("/change-password").patch(verifyJWT, changeCurrentPassword)
router.route("/profile").get(verifyJWT, getCurrentUser)
router.route("/update-profile").patch(verifyJWT, updateAccountDetails)
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar)

export default router