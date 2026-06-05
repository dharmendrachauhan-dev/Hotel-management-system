import mongoose, { model, Schema } from "mongoose"

const reviewSchema = new Schema(
    {
        user:{
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        room: {
            type: Schema.Types.ObjectId,
            ref: "Room"
        },
        rating: {
            type: Number
        },
        comment: {
            type: String
        }
    },
    {timestamps: true}
)

export const Review = new model("Review", reviewSchema)