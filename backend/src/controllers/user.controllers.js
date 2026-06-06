import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiRespose.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"
import { User } from "../models/users.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


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
    // todo
    // take field from req.body
    // check if field empty then shows error
    // if ok then trim it
    // validate email from regex
    // check email unique or not
    // check user exits or not
    // extract file location from local path through multer
    // create user
    // check user created or not
    // response

    const { fullName, email, password, phoneNumber, role } = req.body

    if([fullName, email, password, phoneNumber, role].some(
        (field) => !field || field.trim() === ""
    )) {
        throw new ApiError(400, "All fields required")
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if(!emailRegex.text(email)){
        throw new ApiError(400, "Invalid email")
    }

    const exitedUser = await User.find(email)
    if(exitedUser){
        throw new ApiError(400, "User is already exit")
    }

    const avatarLocalPath = req.file?.avatar?.[0]?.path
    
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file not found")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    const user = await User.create({
        fullName,
        email: email.toLowerCase(),
        password,
        phoneNumber,
        role,
        avatar: {
            url: avatar.url,
            public_id: avatar.public_id
        }
    })

    const createUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            createUser,
            "User registered successfully"
        )
    )
})




export {
    registerUser
}