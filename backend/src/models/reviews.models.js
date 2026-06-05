import mongoose, { model, Schema } from "mongoose"

const reviewSchema = new Schema(
    {
        user:{
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        room: {
            type: Schema.Types.ObjectId,
            ref: "Room",
            required: true
        },
        rating: {
            type: Number,  // rating should be decided 1 to 5 or 1 to 10
            min: 1,
            max: 5,
            required: true
        },
        comment: {
            type: String,
            trim: true,
        }
    },
    {timestamps: true}
)

export const Review = mongoose.model("Review", reviewSchema)