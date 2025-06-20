import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken, changePassword, getCurrentUser, getUserWatchHistory, getUserProgress, updateAccountDetails, deleteUserAccount } from "../controllers/user.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(registerUser)
router.route("/login").post(loginUser)
router.route("/refresh-token").post(refreshAccessToken)
//Secured Routes
router.use(verifyJWT)// Apply verifyJWT middleware to all routes in this file
router.route("/logout").post(logoutUser)
router.route("/current-user").get(getCurrentUser)
router.route("/user-progress").get(getUserProgress)
router.route("/change-password").patch(changePassword)
router.route("/update-account").patch(updateAccountDetails)
router.route("/watch-history").get(getUserWatchHistory)
router.route("/delete-account").patch(deleteUserAccount)

export default router