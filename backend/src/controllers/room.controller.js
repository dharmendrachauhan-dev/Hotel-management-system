import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiRespose.js"
import { Room } from "../models/rooms.models.js"
import mongoose from 'mongoose'


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

const getRoomById = asyncHandler(async (req, res) => {
    /*
    Todo
    step1 => getId from req.params
    ste2 => validate ObjectId format
    step3 => find room by id Room.findbyId(id)
    step4 => check room exits => 404 if not
    step5 => return response 200
    */

    const { id } = req.params
    if(!mongoose.Types.ObjectId.isValid(id)){
        throw new ApiError(400, "Invalid id")
    }

    const userRoom = await Room.findById(id)
    if(!userRoom){
        throw new ApiError(404, "User room not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            userRoom,
            "Room fetched successfully"
        )
    )
})

const updateRoom = asyncHandler(async (req, res)=> {
    /*
        step1 => getid from req.params
        step2 => validate ObjectId format
        step3 => find room by id => 404 if not found
        step4 => extract fields from req.body only update fields thet are provided
        step5 => validate provided fields
                roomType => must be valid enum if provided
                price => must be number, min 0 if provided
                capacity => must be number min 1 if provided
                amenities => must be array of strings if provided
                images => must be array ofstrings if provided
                isAvailable => must be boolean if provided

        step6 => if roomNumber provided check it is not taken by another room
                Room.findOne({ roomNumber, _id: { $ne: id } )   
        
        step7 => update room 
                Room.findByIdAndUpdate(id, updateFields, {new : true})
        
        step8 => return response 200
    */

    const {roomId} = req.params

    if(!mongoose.Types.ObjectId.isValid(roomId)){
        throw new ApiError(400, "Invalid roomId")
    }

    const room = await Room.findById(roomId)
    if(!room){
        throw new ApiError(404, "Room not found")
    }

    const { 
        roomType,
        roomNumber,
        description,
        price,
        capacity,
        amenities,
        images,
        isAvailable
    } = req.body

    const errors = []

    const allowedRoomTypes = ["Single", "Double", "Deluxe", "Suite"]

    if(roomNumber !== undefined & typeof roomNumber !== "number"){
        errors.push("roomNumber must be a number")
    }

    if(roomType !== undefined && !allowedRoomTypes.includes(roomType)){
        errors.push(`roomType must be one of: ${allowedRoomTypes.join(", ")}`)
    }

    if(price !== undefined){
        if(typeof price !== "number"){
            errors.push("Price must be an number")
        } else if (price < 0) {
            errors.push("Price cannot be negative")
        }
    }

    if(capacity !== undefined){
        if(typeof capacity !== "number"){
            errors.push("capacity must be number")
        } else if (capacity < 1){
            errors.push("capacity cannot be negative")
        }
    }

    if(amenities !== undefined){
        if(!Array.isArray(amenities)){
            errors.push("amenities must be an array")
        } else if(amenities.every(items => typeof items !== "string")){
            errors.push("amenities must be string")
        }
    }

    if(images !== undefined){
        if(!Array.isArray(images)){
            errors.push('images must be an array')
        } else if(images.every(items => typeof items !== "string")){
            errors.push("images must be an string")
        }
    }

    if(isAvailable !== undefined && isAvailable !== "boolean"){
        errors.push("isAvailable must be a boolean")
    }

    if(errors.length > 0){
        throw new ApiError(400, errors.join(", "))
    }

    if(roomNumber){
        const existingRoom = await Room.findOne({
            roomNumber,
            _id: { $ne: id }
        })

        if(existingRoom){
            throw new ApiError(409, "Room number already taken")
        }
    }

    const updateFields = {}

    if(roomNumber !== undefined){
        updateFields.roomNumber = roomNumber
    }

    if(roomType !== undefined) {
        updateFields.roomType = roomType
    }

    if(price !== undefined){
        updateFields.roomType = roomType
    }

    if(capacity !== undefined){
        updateFields.capacity = capacity
    }

    if(descrition !== undefined){
        updateFields.description = description
    }
    
    if(amenities !== undefined){
        updateFields.amenities = amenities
    }

    if(images !== undefined){
        updateFields.images = images
    }

    if(isAvailable){
        updateFields.isAvailable = isAvailable
    }

    // update the room

    const updatedRoom = await Room.findByIdAndUpdate(
        id,
        updateFields,
        {new: true}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedRoom,
            "Room updated successfully"
        )
    )
})


const deleteRoom = asyncHandler(async (req, res) => {
    /*
    step1 => getId from req.params
    step2 => validate objectId format
    step3 => find room => 404
    step4 => check room has no active bookings
            Booking.findOne({
                room: id,
                bookingStatus: { $nin: ["Failed", "Completed"] }
            })
                if active bookings exist => 400 cannot delete

    step5 => delete room
        Room.findByIdAndDelete(id)

    step6 => return response 200
    */

    const { id } = req.params
    if(!mongoose.Types.ObjectId.isValid(id)){
        throw new ApiError(400, "Invalid Id")
    }

    const room = await Room.findById(id)
    if(!room){
        throw new ApiError(400, "Room not found")
    }

    const activeBooking = await Booking.findOne({
        room: id,
        bookingStatus: {$nin: ["Failed", "Completed"]}  // it blocks the Completed and Failed from deletion
    })

    if(activeBooking){
        throw new ApiError(400, "Cannot delete room with active bookings")
    }
    
    await Room.findByIdAndDelete(id)
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            null,
            "Room deleted successfully"
        )
    )

})

export {
    creatRoom,
    getAllRooms,
    getRoomById,
    updateRoom,
    deleteRoom
}