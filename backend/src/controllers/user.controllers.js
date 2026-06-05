import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiRespose.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"
import { User } from "../models/users.models.js"


const registerUser = asyncHandler(async (req, res)=> {
    res.json("Hi this is register")
})

export {
    registerUser
}