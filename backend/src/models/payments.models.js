import mongoose, { model, Schema } from "mongoose";

const paymentSchema = new Schema(
    {
        booking: {
            type: Schema.Types.ObjectId,
            ref: "Booking",
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0, // this needed so amount dont go in negative
        },
        paymentMethod: {
            type: String,
            required: true,
            enum: ["Card", "UPI", "Cash", "Net Banking"],// I want here people get only this option or nothing else
        },
        transactionId: {
            type: String,
            unique: true,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            required: true,
            enum: ["Pending", "Completed", "Failed", "Refunded"],
        },
        paidAt: {
            type: Date,
            default: Date.now,
        }
    },
    {timestamps: true}
)

export const Payment = model("Payment", paymentSchema)

