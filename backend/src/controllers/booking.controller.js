import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespose.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { Booking } from "../models/bookings.models.js"


const createBooking = asyncHandler(async (req, res) => {
    // todo
    // validate checkin is before checkout
    // validate checkin is not in the past
    // check room availability for the date range (no ovelapping bookings)
    // calculate and set totalPrice based on room price * nights
    // default bookigsStatus => "pending", "paymentStatus" => "pending"
    // validate at least 1 guest exits in the guests array
    // validate children guest age < 18, adult age >= 18

    

})