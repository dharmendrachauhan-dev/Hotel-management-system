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
            required: true
        },
        totalPrice: {
            type: Number,
            required: true
        },
        bookingStatus: {
            type: String,
            required: true,
            trim: true
        },
        paymentStatus: {
            type: String,
            required: true
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        room: {
            type: Schema.Types.ObjectId,
            ref: "Room"
        }
    },
    {timestamps: true}
)

export const Booking = new model("Booking", bookingSchema)