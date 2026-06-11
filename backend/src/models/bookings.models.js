import mongoose, { model, Schema } from "mongoose";

const guestSchema = new Schema(
    {
        type: {
            type: String,
            required: true,
            enum: ["adult", "children"],
            lowercase: true,
        },
        firstname: {
            type: String,
            required: true,
            trim: true
        },
        lastname:{
            type: String,
            required: true,
            trim: true,
        },
        age:{
            type: Number,
            required: true,
            min: 0
        }
    }
)


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
        totalPrice: {
            type: Number,
            required: true,
            min: 0
        },
        bookingStatus: {
            type: String,
            required: true,
            enum: ["Pending", "Confirmed", "Failed", "Completed"]
        },
        paymentStatus: {
            type: String,
            required: true,
            enum: ["Pending", "Paid", "Failed", "Completed"]
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
        },
        guests: [ guestSchema ],  // subschema
    },
    {timestamps: true}
)

export const Booking = mongoose.model("Booking", bookingSchema)