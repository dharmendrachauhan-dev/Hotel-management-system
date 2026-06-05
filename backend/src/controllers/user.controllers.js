import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiRespose.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"
import { User } from "../models/users.models.js"


const generateAccessAndRefreshToken = async (userId) => {
    try {
        if (!userId) {
            throw new ApiError(400, "UserId is required")
        }
        const user = await User.findById(userId)
        if (!user) {
            throw new ApiError(400, "User not found")
        }

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { refreshToken, accessToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    res.json("Hi this is register")
})

export {
    registerUser
}