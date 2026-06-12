import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export const adminOnly = asyncHandler (async (req, res, next) => {
    if(!req.user){
        throw new ApiError(401, " Not authorized, please login")
    }

    if(!req.user.role === "admin"){
        throw new ApiError(400, "Access denied, admin only")
    }

    next()
})

