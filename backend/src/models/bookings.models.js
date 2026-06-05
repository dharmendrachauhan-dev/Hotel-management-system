import mongoose, { model, Schema } from "mongoose";

const bookingSchema = new Schema(
    {
        checkIn: {
            type: Date,
            required: true,
        },
        checkOut: {
            type: Date,
            required: true
        },
        guests: {
            type: Number,
            required: true,
            min: 1
        },
        totalPrice: {
            type: Number,
            required: true,
            min: 0
        },
        bookingStatus: {
            type: String,
            required: true,
            enum: ["Pending", "Confirmed", "Failed"]
        },
        paymentStatus: {
            type: String,
            required: true,
            enum: ["Pending", "Paid", "Failed"]
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        room: {
            type: Schema.Types.ObjectId,
            ref: "Room",
            required: true
        }
    },
    {timestamps: true}
)

export const Booking = mongoose.model("Booking", bookingSchema)