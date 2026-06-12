import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespose.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { Booking } from "../models/bookings.models.js"
import { Room } from "../models/rooms.models.js"


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




export {
    createBooking
}
