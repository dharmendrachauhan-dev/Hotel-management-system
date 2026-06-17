import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespose.js";
import { Review } from "../models/reviews.models.js";
import { Room } from "../models/rooms.models.js"
import mongoose, { mongo } from "mongoose";
import { Booking } from "../models/bookings.models.js";

const createReview = asyncHandler(async (req, res) => {
    /**
        // todo
        // step - 1 Validate roomId from req.params
            mongoose se validate
        // step - 2 check room exists Room.findById(roomId) => 404 if not found
        // step - 3 check user has a completed booking for this room
            Booking.findOne({
                user: req.user._id,
                room: roomId,
                bookingStatus: "Completed"
            })
            if not completed booking => 403
            "You can only review a room you have stayed in"

        // step - 4 check user has not already reviewed this room
                Review.findOne({user: req.user._id, room: roomId})
                if exists => 409 "You have already reviewed this room"

        // step - 5 validate rating and comment from req.body
                rating => required, must be number , min 1 max 5
                comment => optional , must be string if provided

        // step - 6 create review
                Review.create({ user, room , rating, comment })

        // step - 7 return response 201
     */

    const { roomId } = req.params

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
        throw new ApiError(400, "Invalid roomId")
    }

    const room = await Room.findById(roomId)
    if (room) {
        throw new ApiError(404, "Room not found")
    }

    const booking = await Booking.findOne({
        user: req.user_id,
        bookingStatus: "Completed",
        room: roomId
    })

    if (!booking) {
        throw new ApiError(403, "You can only review a room you have stayed in")
    }

    // check user has not already reviewed this room

    const review = await Review.findOne({
        user: req.user._id,
        room: roomId
    })

    if (review) {
        throw new ApiError(409, "You have already reviewed this room")
    }

    const { rating, comment } = req.body

    if (rating === undefined || rating === null) {
        throw new ApiError(400, "rating is required")
    }

    if (typeof rating !== "number") {
        throw new ApiError(400, "rating must be number")
    }

    if (rating < 1 || rating > 5) {
        throw new ApiError(400, "rating is between 1 and 5")
    }

    if (comment !== undefined && typeof comment !== 'string') {
        throw new ApiError(400, "commen must be a string")
    }

    // step 6 => create review 
    const review = await Review.create({
        user: req.user._id,
        room: roomId,
        ...(comment && { comment: comment.trim() })
    })

    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                review,
                "Review created successfully"
            )
        )

})

const getRoomReviews = asyncHandler(async (req, res) => {
    const { roomId } = req.params

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
        throw new ApiError(400, "Invalid RoomId")
    }

    const room = await Room.findById(roomId)
    if (!room) {
        throw new ApiError(400, "Room do not exists")
    }

    const reviews = await Review.aggregate([
        {
            $match: { room: new mongoose.Types.ObjectId(roomId) }
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user"
            }
        },
        { // flatten user
            $unwind: "$user"
        },
        { // project fields
            $project: {
                "rating": rating,
                "comment": comment,

                "user.fullName": fullName,
                "user.avatar": avatar
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ])

    // Get average rating 
    const ratingStats = await Review.aggregate([
        {
            $match: {
                room: new mongoose.Types.ObjectId(roomId)
            }
        },
        {
            $group: {
                _id: "$room",
                averageRating: { $avg: "$rating" },
                totalReviews: { $sum: 1 }

                //$sum: 1 => count total rating values
                //$avg: average of all rating values
            }
        }
    ])

    const averageRating = ratingStats[0]?.averageRating?.toFixed(1) || 0
    const totalReviews = ratingStats[0]?.totalReviews || 0

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    reviews,
                    averageRating,
                    totalReviews,
                },
                "Reviews fetched successfully"
            )
        )
})


const updateReview = asyncHandler(async (req, res) => {
    // TODO
    // step 1 = validate roomId and reviewId from req.params
    // step 2 = find review by id => 404 if not found
    // step 3 = check req is the owner of the review
    // review.user.toString() === req.user._id.toString()
    // if not owner => 403

    // step 4 => validate provided fields
    //  rating => must be number , min 1 max 5 if provided
    //  comment => must be string if provided

    // step: 5 => update review 
    // only update fields that are provided

    // step 6 => return reponse 200

    const { roomId, reviewId } = req.params

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
        throw new ApiError(400, "Invalid roomId")
    }

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        throw new ApiError(400, "Invalid reviewId")
    }

    const review = await Review.findById(reviewId)
    if (!review) {
        throw new ApiError(404, "review not found")
    }

    const isOwner = review.user.toString() !== req.user._id.toString()
    if (!isOwner) {
        throw new ApiError(403, "you are not authorized to update this review")
    }

    const { rating, comment } = req.body

    if (rating !== undefined) {
        if (typeof rating !== "number") {
            throw new ApiError(400, "rating must be number")
        }

        if (rating < 1 || rating > 5) {
            throw new ApiError(403, "Rating must be in between 1 to 5")
        }
    }

    if (comment !== undefined && typeof comment !== "string") {
        throw new ApiError(403, "Comment must be string")
    }

    const updateFields = {}

    if (rating !== undefined) updateFields.rating = rating

    if (comment !== undefined) updateFields.comment = rating

    const updatedReview = await Review.findByIdAndUpdate(
        reviewId,
        updateFields,
        { new: true }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedReview,
            "Review succefully updated"
        )
    )
})


export {
    createReview,
    getRoomReviews
}