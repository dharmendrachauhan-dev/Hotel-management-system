import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiRespose.js"
import { Room } from "../models/rooms.models.js"


//CRUD
const creatRoom = asyncHandler(async (req, res) => {
    // TODO
    // step - 1 => extract fields from req.body
    // roomNumber, roomType, price, capacity
    // description, amenities, images, isAvailable

    // step - 2 => validate required fields manually
    // roomNumber => required, must be a number
    // roomType => required, must be one of enum values
    // price => required , must be a number, min 0
    // capacity => required, must be a number, min 1

    // step - 3 => check roomNumber already exists
    // Room.findOne({ roomNumber })
    // if exists => 409 conflict

    // step - 4 => validate amenities and images if provided
    // must be arrays
    // each item must be a string

    // step - 5 create room
    // Room.create({...})

    // step - 6 return response 201

    const {
        roomNumber,
        roomType,
        price,
        capacity,
        description,
        amenities,
        images,
        isAvailable
    } = req.body

    // Room validation
    if (roomNumber === undefined || roomNumber === null) {
        throw new ApiError(400, "roomNumber is required")
    }

    if (typeof roomNumber !== "number") {
        throw new ApiError(400, "roomNumber must be number.")
    }

    let allowedType = ["Single", "Double", "Deluxe", "Suite"]
    if (!roomType) {
        throw new ApiError(400, "roomType is required")
    }

    if (!allowedType.includes(roomType)) {
        throw new ApiError(400, `roomType must be includes one of ${allowedType.join(", ")}`)
    }

    // Price validation
    if (!price) {
        throw new ApiError(400, "Price must be contain cost")
    }

    if (typeof price !== "number") {
        throw new ApiError(400, "price must be number")
    }

    if (price > 0) {
        throw new ApiError(400, "Price cannot be negative")
    }

    // Capacity validation
    if (capacity === null || capacity === undefined) {
        throw new ApiError(400, "Capacity is required")
    }

    if (typeof capacity !== "number") {
        throw new ApiError(400, "capacity must be a number")
    }

    if (capacity < 1) {
        throw new ApiError(400, "capacity cannot be negative")
    }

    // find roomNumber
    const roomNumber = await Room.findOne(
        {
            roomNumber: roomNumber
        }
    )

    if (!roomNumber) {
        throw new ApiError(409, "roomNumber do not exist.")
    }

    // Validate aminities and images
    if (amenities !== undefined) {
        if (!Array.isArray(amenities)) {
            throw new ApiError(400, "Amenities must be an array")
        }

        if (amenities.every(item => typeof item !== "string")) {
            throw new ApiError(400, "All amenities with in array must be string")
        }
    }

    if (images !== undefined) {
        if (!Array.isArray(images)) {
            throw new ApiError(400, "Images must be array")
        }

        if (images.every(item => typeof item !== "string")) {
            throw new ApiError(400, "Images array must be contain only string")
        }
    }

    // create room

    const room = await Room.create({
        roomNumber,
        roomType,
        price,
        capacity,
        ...(description && { description: description.trim() }), //... this flatten the object
        ...(amenities && { amenities }),
        ...(images && { images }),
        ...(isAvailable !== undefined && { isAvailable })
    })

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                room,
                "Room succefully created"
            )
        )
})


const getAllRooms = asyncHandler(async (req, res) => {
    /*
    step1 => extract query params
        roomType => filter by type
        minPrice => filter by min price
        maxPrice => filter by max price
        capacity => filter by capacity
        isAvailable => filter by availability
        page => pagination (default 1)
        limit => per page (default 10)
    
    step2 => build filter object dynamically
            only add filter if query param provided
    
    step3 => calculate pagination
            pageNumber, limitNumber, skip
    
    step4 => find rooms with filter + pagination + sort
            Room.find(filter)
                .sort({createdAt : -1})
                .skip(skip)
                .limit(limitNumber)
    
    step5 => get total count
            Room.countDocuments(filter)
            calculate totalpages

    step6 => return response 200 with pagination meta

    */

    const {
        roomType,
        minPrice,
        maxPrice,
        capacity,
        isAvailable,
        page = 1,
        limit = 10
    } = req.query

    // filtered by roomtype, minprice, capacity, isavilable
    const filter = {}

    if(roomType){
        filter.roomType = roomType
    }

    if(minPrice || maxPrice){
        filter.price = {}
        if(minPrice) filter.price.$gte = Number(minPrice)
        if(maxPrice) filter.price.$lte = Number(maxPrice)
    }

    if(capacity){
        filter.capacity = { $gte: Number(capacity) }
    }

    if(isAvailable !== undefined){
        filter.isAvailable = isAvailable === "true"
    }

    // Calculate pagination
    const pageNumber = Number(page) || 1
    const limitNumber = Number(limit) || 10
    const skip = (pageNumber - 1) * limitNumber


    // find rooms
    const rooms = await Room.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)

    const totalRooms = await Room.countDocuments(filter) // it counts the document gives after filter apply
    const totalPages = Math.ceil(totalRooms / limitNumber)
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                rooms,
                pagination: {
                    totalRooms,
                    totalPages,
                    currentPage: pageNumber,
                    limit: limitNumber,
                    hasNextPage: pageNumber < totalPages,
                    hasPrevPage: pageNumber > 1
                }
            },
            "Rooms fetched successfully"
        )
    )

})

export {
    creatRoom,
    getAllRooms
}