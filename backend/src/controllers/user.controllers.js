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
    const isValid = emailRegex.test(email)
    if(!isValid){
        throw new ApiError(400, "Invalid email")
    }

    const exitedUser = await User.findOne({  // if you use find that is return array and the condition become true thats we are using findOne method
        $or: [{email}, {phoneNumber}]
    })

    if(exitedUser){
        throw new ApiError(400, "User is already exit")
    }

    const avatarLocalPath = req.file?.path
    console.log("Avatar local path => ",avatarLocalPath)
    
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

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            createdUser,
            "User registered successfully"
        )
    )
})


const loginUser = asyncHandler (async (req, res)=> {

    // email or phoneNumber and password req.params
    // check field
    // find user 
    // check this user
    // password check
    // validate password
    // generate refresh and access token
    // unselect the password and refresh token
    // add options for cookies
    // In response send cookies(refresh token and access token) 

    const {email, password, phoneNumber} = req.body
    if((!email && !password) || !password){
        throw new ApiError(400 , "Email or phone number and password are required")
    }

    const user = await User.find({
        $or: [{email}, {phoneNumber}]
    })

    if(!user){
        throw new ApiError(404, "User not found")
    }
    
    const isPasswordCorrect = await User.isPasswordCorrect(user._id)
    if(!isPasswordCorrect){
        throw new ApiError(401, "Invalid user credentials")
    }

    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(user._id)

    
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,
                refreshToken,
                accessToken
            },
            "User successfully logged in."
        )
    )
})

export {
    registerUser,
    loginUser
}