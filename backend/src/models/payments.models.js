import mongoose, { model, Schema } from "mongoose";

const paymentSchema = new Schema(
    {
        booking: {
            type: Schema.Types.ObjectId,
            ref: "Booking"
        },
        amount: {
            type: Number,
            required: true
        },
        paymentMethod: {
            type: String,
            required: true
        },
        transactionId: {
            type: String,
            unique: true,
            required: true
        },
        status: {
            type: String,
            required: true
        },
        paidAt: {
            type: Date,
            required: true
        }
    }
)

export const Payment = new model("Payment", paymentSchema)

