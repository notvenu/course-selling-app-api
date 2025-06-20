import { asyncHandler } from "../utils/asyncHandler.util";
import { apiError } from "../utils/apiError.util";
import { User } from "../models/user.model";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization").replace("Bearer", "")
        if(!token){
            throw new apiError(401, "Access Token is required.")
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        if(!user){
            throw new apiError(401, "User not found or invalid token.")
        }
        req.user = user
        next()
    } catch (error) {
        throw new apiError(401, "Unauthorized access. Invalid token.", error.message)
    }
})