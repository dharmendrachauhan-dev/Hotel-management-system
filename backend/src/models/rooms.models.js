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
            required: true,
            enum: ["Single", "Double", "Deluxe", "Suite"] // Only this values are value
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        capacity: {
            type: Number,
            required: true,
            min: 1
        },
        description: {
            type: String,
            default: "This is clean and ready to use top class room for your family",
            trim: true
        },
        amenities: [String], //this should be in array
        images: [String], //this should be in array
        isAvailable: {
            type: Boolean,
            default: true 
        },
    },
    {timestamps: true}
)

export const Room = mongoose.model("Room", roomSchema)