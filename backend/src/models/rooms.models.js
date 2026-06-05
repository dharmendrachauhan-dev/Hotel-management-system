import mongoose, { model, Schema } from "mongoose";

const roomSchema = new Schema(
    {
        roomNumber: {
            type: Number,
            required: true,
            unique: true
        },
        roomType: {
            type: String,
            unique: true,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        capacity: {
            type: Number,
            required: true
        },
        description: {
            type: String,
            default: "This is clean and ready to use top class room for your family"
        },
        amenities: {
            type: String
        },
        images: {
            type: String,
        },
        isAvailable: {
            type: Boolean,
            required: true
        },
    },
    {timestamps: true}
)

export const Room = new model("Room", roomSchema)