import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespose.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { Booking } from "../models/bookings.models.js"
import { Room } from "../models/rooms.models.js"
import mongoose, { mongo } from "mongoose";


const createBooking = asyncHandler(async (req, res) => {
    // todo
    // validate checkin is before checkout
    // validate checkin is not in the past
    // check room availability for the date range (no ovelapping bookings)
    // calculate and set totalPrice based on room price * nights
    // default bookigsStatus => "pending", "paymentStatus" => "pending"
    // validate at least 1 guest exits in the guests array
    // validate children guest age < 18, adult age >= 18
    try {


        const { guests, room: roomId } = req.body
        const { checkInDate, checkOutDate } = req.parsedDate // middelware

        // 1-check room exits
        const room = await Room.findById(roomId)
        if (!room) {
            throw new ApiError(404, "Room not found")
        }

        // 2. check room availatbility
        const overlappingBooking = await Booking.findOne({
            room: roomId,
            bookingStatus: { $nin: ["Failed", "Completed"] }, // $ nin => "not in" ignore Failed and completed bookings
            checkIn: { $lt: checkOutDate }, // greater than // existing checkIn < new checkOut
            checkOut: { $gt: checkInDate } // less than // Existing checkOut > new checkIn
        })

        if (overlappingBooking) {
            throw new ApiError(409, "Room is not available for the selected dates.")
        }

        // calculate price
        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))
        const totalPrice = nights * room.price

        const booking = await Booking.create({
            checkIn: checkInDate,
            checkOut: checkOutDate,
            guests,
            totalPrice,
            bookingStatus: "Pending",
            paymentStatus: "Pending",
            user: req.user._id,
            room: roomId
        })

        const bookingWithDetails = await Booking.aggregate([
            // step1 = find the booking we just created
            {
                $match: {
                    _id: booking._id
                }
            },
            // Step 2 = Join with users collection
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "user"
                }
            },
            // stage 3 => user comes back as array [ {...} ]
            // $unwind flattens it to a single object {..}

            {
                $unwind: "$user"
            },

            // Stage 4 => join with rooms collection

            {
                $lookup: {
                    from: "rooms",
                    localField: "room",
                    foreignField: "_id",
                    as: "room"
                }
            },
            // stage 5 => flatten into array obj to only object
            {
                $unwind: "$room"
            },
            {
                $project: {
                    checkIn: 1,
                    checkOut: 1,
                    guests: 1,
                    totalPrice: 1,
                    bookingStatus: 1,
                    paymentStatus: 1,
                    createdAt: 1,

                    // from user
                    "user.name": 1,
                    "user.email": 1,

                    // from room 
                    "room.roomNumber": 1,
                    "room.type": 1,
                    "room.price": 1
                }
            }
        ])

        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    bookingWithDetails[0],
                    "Booking created successfully"
                )
            )
    } catch (error) {
        console.log("CreatedBooking error: ", error)
        return res
            .status(500)
            .json(
                new ApiError(
                    500,
                    error,
                    "Something went wrong"
                )
            )
    }
})

export const getAllBookings = asyncHandler(async (req, res) => {
    // step - 1 : Extract query params from req.query
    // get /booking?bookingStatus=confirmed&page=2&limit=10
    // req.query = { bookingStatus: "Confirmed", page: "2", limit: "10" }

    // extract these
    // bookingStatus => "pending" | "Confirmed" | "Failed" | "Completed"
    // paymentStatus => "Pending" | "Paid" | "Failed" | "Completed"
    // checkInFrom => start of date range (some date)
    // checkOut => end of date range (some date)
    // page => which page (default: 1)
    // limit => how many per page (default: 2)

    // step - 2 : Build filter object dynamically
    // start with empty filter{}
    // only add a filter if that query param was actually provided
    // if nothing provided => return all booking

    // bookingStatus provided => add to filter
    // paymentStatus provided => add to filter
    // checkinform to checkinto provided => add $gte / $lte on checkIn field

    // step-3 calculate pagination numbers
    // page = number(page) || 1 conver string to number
    // limit = number(limit) || 10
    // skip = (page - 1) * limit

    // page1 => skip 0 (start from beginning)
    // page2 => skip 10 (skip first 10)
    // page3 => skip 20 (skip first 20)

    // step -4 Run aggregate pipeline
    // Stage 1 => $match apply the filter object from step2
    // stage 2 => $lookup join users collection
    // stage 3 => $unwind flatten user array
    // stage 4 => $lookup join rooms collection
    // stage 5 => $unwind flatten user array
    // stage 6 => $project pick only needed fields
    // user => name, email
    // room => roomNumber, type, price
    // stage 7 => $sort createdAt: -1 (newest first)
    // stage 8 => $skip skip records for pagination
    // stage 9 => limit records per page


    // step: 5 get total count for pagination meta
    // run booking.countDocuments(filter)
    // this tells frontend how many total pages exist
    // totalPages = Math.ceil(totalCount/ limit)

    // step: 6 send response
    // {
    //     success: true,
    //     data: bookings,
    //     pagination: {
    //         totalBookings,
    //         totalPages,
    //         currentPage,
    //         limit,
    //         hasNextPage,     ← currentPage < totalPages
    //         hasPrevPage,     ← currentPage > 1
    //     }
    // }

    // step= 1
    const {
        bookingStatus,
        paymentStatus,
        checkInFrom,
        checkInTo,
        checkOutFrom,
        checkOutTo,
        page = 1, // for start default
        limit = 10, // for start default 
    } = req.query


    // step = 2
    const filter = {}

    // filter by booking status
    if(bookingStatus){
        filter.bookingStatus = bookingStatus
    }

    // filter by paymentstatus
    if(paymentStatus){
        filter.paymentStatus = paymentStatus
    }

    // filter by checkInFrom to checkInTo 
    if(checkInFrom || checkInTo){
        filter.checkIn = {}
        if (checkInFrom) filter.checkIn.$gte = new Date(checkInFrom)
        if (checkInTo) filter.checkIn.$lte = new Date(checkInTo)
    }

    // filter by checkOutFrom to checkOutTo
    if(checkOutFrom || checkOutTo){
        filter.checkOut = {}
        if(checkOutFrom) filter.checkOut.$gte = new Date(checkOutFrom)
        if(checkOutTo) filter.checkOut.$lte = new Date(checkOutIn)
    }

    // calculate pagination number
    const pageNumber = Number(page) || 1
    const limitNumber = Number(limit) || 10
    const skip = (pageNumber - 1) * limitNumber

    // Step 4 aggregate pipeline

    const bookings = await Booking.aggregate([
        {
            $match: filter
        },
        { // join users collection
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user"
            }
        },
        { // flatten the array {..}
           $unwind: "$user"
        },
        { // join room collection
            $lookup: {
                from: "rooms",
                localField: "room",
                foreignField: "_id",
                as: "room"
            }
        },
        { // flatten the array {..}
            $unwind: "$room"
        },
        { // pick only needed fields
            $project: {
                checkIn: 1,
                checkOut: 1,
                guests: 1,
                totalPrice: 1,
                bookingStatus: 1,
                paymentStatus: 1,
                createdAt: 1,

                // user object
                "user.fullname": 1,
                "user.email": 1,

                // room object
                "room.roomNumber": 1,
                "room.type": 1,
                "room.price": 1,
            }
        },
        {  // sort by createdAt newest first
            $sort: {
                createdAt: -1
            }
        },
        { // skip records for pagination
            $skip: skip
        },
        { // limit records per page
            $limit: limitNumber
        }
    ])

    const totalBookings = await Booking.countDocuments(filter) // only show filtered bookings
    const totalPages = Math.ceil(totalBookings / limitNumber)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                bookings,
                pagination: {
                    totalBookings,
                    totalPages,
                    currentPage: pageNumber,
                    limit: limitNumber,
                    hasNextPage: pageNumber < totalPages,
                    hasPrevPage: pageNumber > 1
                }
            },
            "Booking fetched successfully"
        )
    )
})

export const getMyBookings = asyncHandler(async (req, res) => {
    //ToDo
    // step1 : get user id from token
    // verifyjwt already attached req.user
    // no need => req.params or req.body
    // step2: Aggregate pipeline
    //       add collection room to booking 
    //       show the mybooking to user
    //       by $project
    // return response

    const userId = req.user?._id
    if(!userId){
        throw new ApiError(400, "Userid not found")
    }

    const bookings = await Booking.aggregate([
        {
            $match: userId
        },
        { // join collection to booking
            $lookup: {
                from: "rooms",
                localField: "room",
                foreignField: "_id",
                as: "room"
            }
        },
        { // flatten array {..}
            $unwind: "$room"
        },
        {   // make fields
            //
            $project: {
                checkIn: 1,
                checkOut: 1,
                guests: 1,
                totalPrice: 1,
                bookingStatus: 1,
                paymentStatus: 1,
                createdAt: 1,

                // user
                "room.roomNumber": 1,
                "room.type": 1,
                "room.type": 1
            }
        },
        // stage 5: newest first
        {
            $sort: {
                createdAt: -1
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            bookings[0],
            "My Bookings successfully fetched"
        )
    )

})


export const getBookingById = asyncHandler (async (req, res) => {
    // Step-1 : get bookingId from params
    // step-2 : validate ObjectId format
    // step-3 : aggregate pipeline
    // step-4 : check booking exits
    // step-5 : restrict other user if other then owner and admin
    // step -6 : return resonse

    const { Id } = req.params

    if(!mongoose.Types.ObjectId.isValid(id)){
        throw new ApiError(400, "Invalid BookingId.")
    }

    const booking = await Booking.aggregate([
        {
            $match: new mongoose.Types.ObjectId(Id)
        },
        { // join users
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user"
            }
        },
        {
            $unwind: "$user"
        },
        {
            $lookup: {
                from: "rooms",
                localField: "room",
                foreignField: "_id",
                as: "room"
            }
        },
        {
            $unwind: "$user"
        },
        {
            $project: {
                checkIn: 1,
                checkOut: 1,
                guests: 1,
                totalPrice: 1,
                bookingStatus: 1,
                paymentStatus: 1,
                createdAt: 1,

                // user

                "user._id": 1,
                "user.fullName": 1,
                "user.email": 1,

                // room

                "room.roomNumber": 1,
                "room.type": 1,
                "room.price": 1
            }
        }
    ])
    
    const bookingData = booking[0]

    if(!bookingData){
        throw new ApiError(404, "Booking not found")
    }

    const isOwner = bookingData.user._id.toString() === req.user._id.toString()
    const isAdmin = req.user.role === "admin"

    if(!isOwner && !isAdmin){
        throw new ApiError(400, "You are not allowed to view this booking.")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            bookingData,
            "Booking fetched successfully"
        )
    )
})
export {
    createBooking,
    getAllBookings,
    getMyBookings,
    getBookingById
}
